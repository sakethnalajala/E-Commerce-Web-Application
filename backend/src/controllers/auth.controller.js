import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/ApiResponse.js';
import { signAccessToken, createPasswordResetToken, hashResetToken } from '../utils/token.js';
import { sendPasswordResetEmail, isEmailConfigured } from '../services/email.service.js';
import { providerStatus, verifyGoogle, verifyApple } from '../services/oauth.service.js';
import { resolveDemoCustomer, resolveDemoAdmin } from '../services/demoAccount.service.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

const buildAuthPayload = (user) => ({
  token: signAccessToken(user),
  user: user.toJSON(),
});

/** POST /auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  // Role is never taken from the request body — privilege escalation guard.
  const user = await User.create({ name, email, password, phone });

  return sendCreated(res, {
    message: 'Account created successfully.',
    data: buildAuthPayload(user),
  });
});

/** POST /auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  // A social-only account has no password yet; say so instead of "invalid".
  if (user && !user.password && user.authProvider !== 'local') {
    const provider = user.authProvider === 'google' ? 'Google' : 'Apple';
    throw ApiError.unauthorized(
      `This account signs in with ${provider}. Use "Continue with ${provider}", or set a password via "Forgot password".`
    );
  }

  // Same message for unknown email and wrong password — no account enumeration.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  return sendSuccess(res, { message: 'Logged in successfully.', data: buildAuthPayload(user) });
});

/**
 * POST /auth/logout
 * JWTs are stateless, so logout clears the optional cookie and instructs the
 * client to discard its token.
 */
export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: env.isProduction ? 'none' : 'lax',
    secure: env.isProduction,
  });

  return sendSuccess(res, { message: 'Logged out successfully.' });
});

/** GET /auth/me */
export const getMe = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Profile loaded.', data: { user: req.user.toJSON() } })
);

/**
 * POST /auth/forgot-password
 * Always answers 200 with the same message so the endpoint cannot be used to
 * discover which email addresses have accounts.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMessage =
    'If an account exists for that email, a password reset link has been sent.';

  const user = await User.findOne({ email });

  if (!user || !user.isActive) {
    return sendSuccess(res, { message: genericMessage });
  }

  const { rawToken, hashedToken, expiresAt } = createPasswordResetToken();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = expiresAt;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresInMinutes: env.passwordReset.expiresInMinutes,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw ApiError.serviceUnavailable('Could not send the reset email. Please try again shortly.');
  }

  const data = {};
  // Without SMTP configured there is no way to receive the link, so in
  // development only it is returned directly to keep the flow testable.
  if (!isEmailConfigured && !env.isProduction) {
    logger.warn(`Password reset link (development only): ${resetUrl}`);
    data.resetUrl = resetUrl;
    data.devNote = 'SMTP is not configured — this link is only returned outside production.';
  }

  return sendSuccess(res, { message: genericMessage, data: Object.keys(data).length ? data : null });
});

/** POST /auth/reset-password/:token */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw ApiError.badRequest('This password reset link is invalid or has expired.');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save(); // pre-save hook hashes the password and stamps passwordChangedAt

  return sendSuccess(res, {
    message: 'Password updated. You can now log in with your new password.',
  });
});

/** PATCH /auth/change-password */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (user && !user.password) {
    throw ApiError.badRequest(
      'This account has no password yet because it signs in with Google or Apple. Use "Forgot password" to set one.'
    );
  }
  if (!user || !(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Your current password is incorrect.');
  }

  user.password = newPassword;
  await user.save();

  // Old tokens are invalid after a password change — issue a fresh one.
  return sendSuccess(res, {
    message: 'Password changed successfully.',
    data: { token: signAccessToken(user) },
  });
});

/* ------------------------------------------------------------------ */
/* Social sign-in                                                      */
/* ------------------------------------------------------------------ */

/**
 * GET /auth/providers — how the login page can sign someone in.
 *
 * Public client IDs only for the social providers, plus the demo customer if
 * the server has one that actually works. Keeping the demo credentials here
 * rather than in the frontend means they are configuration, not something
 * baked into the shipped JavaScript.
 */
export const getProviders = asyncHandler(async (_req, res) =>
  sendSuccess(res, {
    message: 'Sign-in providers.',
    data: {
      ...providerStatus(),
      // The admin entry is consumed only by the admin sign-in page.
      demo: { customer: await resolveDemoCustomer(), admin: await resolveDemoAdmin() },
    },
  })
);

/**
 * Finds the account for a verified social identity, or creates one. Matching
 * order: provider subject ID, then verified email (which links an existing
 * password account to the provider). New accounts are always customers.
 */
const signInWithProvider = async (identity) => {
  const idField = `${identity.provider}Id`;

  let user = await User.findOne({ [idField]: identity.providerId });
  if (!user) {
    user = await User.findOne({ email: identity.email });
    if (user) {
      user[idField] = identity.providerId;
      if (!user.avatar?.url && identity.avatarUrl) user.avatar = { url: identity.avatarUrl, publicId: '' };
    } else {
      user = new User({
        name: identity.name,
        email: identity.email,
        authProvider: identity.provider,
        [idField]: identity.providerId,
        avatar: { url: identity.avatarUrl, publicId: '' },
      });
    }
  }

  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: user.isNew });
  return buildAuthPayload(user);
};

/** POST /auth/google — body: { code } (popup code flow) or { credential } (ID token). */
export const googleSignIn = asyncHandler(async (req, res) => {
  const identity = await verifyGoogle({ code: req.body.code, credential: req.body.credential });
  const data = await signInWithProvider(identity);
  return sendSuccess(res, { message: 'Signed in with Google.', data });
});

/** POST /auth/apple — body: { identityToken, user? } from Sign in with Apple JS. */
export const appleSignIn = asyncHandler(async (req, res) => {
  const identity = await verifyApple({ identityToken: req.body.identityToken, user: req.body.user });
  const data = await signInWithProvider(identity);
  return sendSuccess(res, { message: 'Signed in with Apple.', data });
});
