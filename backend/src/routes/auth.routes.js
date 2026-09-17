import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  getProviders,
  googleSignIn,
  appleSignIn,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware.js';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  googleSignInValidation,
  appleSignInValidation,
} from '../validations/auth.validation.js';

const router = Router();

router.post('/register', authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/logout', logout);

// Social sign-in: the browser hands over a provider token, the server verifies
// it against the provider's keys and issues the same JWT as a password login.
router.get('/providers', getProviders);
router.post('/google', authLimiter, validate(googleSignInValidation), googleSignIn);
router.post('/apple', authLimiter, validate(appleSignInValidation), appleSignIn);

router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordValidation),
  forgotPassword
);
router.post(
  '/reset-password/:token',
  passwordResetLimiter,
  validate(resetPasswordValidation),
  resetPassword
);

router.get('/me', protect, getMe);
router.patch('/change-password', protect, validate(changePasswordValidation), changePassword);

export default router;
