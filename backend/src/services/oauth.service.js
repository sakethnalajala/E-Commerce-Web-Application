/**
 * Social sign-in verification. Each provider hands the browser a signed
 * identity token (or, for Google's popup code flow, a one-time code). Nothing
 * from the browser is trusted until the token has been verified here against
 * the provider's public keys and our own client ID.
 */
import { OAuth2Client } from 'google-auth-library';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

export const isGoogleConfigured = Boolean(env.oauth.google.clientId);
export const isAppleConfigured = Boolean(env.oauth.apple.clientId);

/** Public provider status for the client — client IDs only, never secrets. */
export const providerStatus = () => ({
  google: {
    enabled: isGoogleConfigured,
    clientId: isGoogleConfigured ? env.oauth.google.clientId : null,
    // The popup code flow needs the secret server-side; without it we only
    // accept ID tokens (GIS button / One Tap).
    codeFlow: isGoogleConfigured && Boolean(env.oauth.google.clientSecret),
  },
  apple: {
    enabled: isAppleConfigured,
    clientId: isAppleConfigured ? env.oauth.apple.clientId : null,
    redirectUri: isAppleConfigured ? env.oauth.apple.redirectUri || `${env.clientUrl}/login` : null,
  },
});

const googleClient = isGoogleConfigured
  ? new OAuth2Client({
      clientId: env.oauth.google.clientId,
      clientSecret: env.oauth.google.clientSecret || undefined,
      // 'postmessage' is the redirect URI Google expects for popup code flows.
      redirectUri: 'postmessage',
    })
  : null;

/**
 * Verifies a Google sign-in. Accepts either `{ code }` (authorization code
 * from the popup flow, exchanged here with the client secret) or
 * `{ credential }` (an ID token from the GIS button / One Tap).
 */
export const verifyGoogle = async ({ code, credential }) => {
  if (!isGoogleConfigured) {
    throw ApiError.serviceUnavailable('Google sign-in is not configured on this server.');
  }

  let idToken = credential;
  if (code) {
    if (!env.oauth.google.clientSecret) {
      throw ApiError.serviceUnavailable('Google sign-in needs GOOGLE_CLIENT_SECRET on the server for the popup flow.');
    }
    try {
      const { tokens } = await googleClient.getToken(code);
      idToken = tokens.id_token;
    } catch (error) {
      throw ApiError.unauthorized('Google did not accept this sign-in. Please try again.');
    }
  }
  if (!idToken) throw ApiError.badRequest('A Google credential is required.');

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken, audience: env.oauth.google.clientId });
    payload = ticket.getPayload();
  } catch (error) {
    throw ApiError.unauthorized('Google sign-in could not be verified.');
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw ApiError.unauthorized('Your Google account has no verified email address.');
  }

  return {
    provider: 'google',
    providerId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatarUrl: payload.picture || '',
  };
};

const APPLE_ISSUER = 'https://appleid.apple.com';
const appleJwks = isAppleConfigured ? createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys')) : null;

/**
 * Verifies an Apple identity token (JWT signed by Apple, RS256). Apple only
 * sends the user's name on the very first authorization, so the client passes
 * it along as `user` when present.
 */
export const verifyApple = async ({ identityToken, user }) => {
  if (!isAppleConfigured) {
    throw ApiError.serviceUnavailable('Apple sign-in is not configured on this server.');
  }
  if (!identityToken) throw ApiError.badRequest('An Apple identity token is required.');

  let payload;
  try {
    ({ payload } = await jwtVerify(identityToken, appleJwks, {
      issuer: APPLE_ISSUER,
      audience: env.oauth.apple.clientId,
    }));
  } catch (error) {
    throw ApiError.unauthorized('Apple sign-in could not be verified.');
  }

  // Apple's email_verified may be a boolean or the string "true".
  const verified = payload.email_verified === true || payload.email_verified === 'true';
  if (!payload.email || !verified) {
    throw ApiError.unauthorized('Your Apple ID did not share a verified email address.');
  }

  const firstName = user?.name?.firstName?.trim();
  const lastName = user?.name?.lastName?.trim();
  const name = [firstName, lastName].filter(Boolean).join(' ') || payload.email.split('@')[0];

  return {
    provider: 'apple',
    providerId: payload.sub,
    email: payload.email,
    name,
    avatarUrl: '',
  };
};
