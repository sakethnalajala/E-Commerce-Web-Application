import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.js';
import { ROLES } from '../utils/constants.js';

const extractToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  if (req.cookies?.accessToken) return req.cookies.accessToken;
  return null;
};

/**
 * Verifies the JWT, loads the user and attaches it to req.user.
 * Rejects tokens for deleted, deactivated users, or tokens issued before the
 * user's last password change.
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Authentication required. Please log in.');

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token.');
  }

  const user = await User.findById(decoded.sub).select('+passwordChangedAt');
  if (!user) throw ApiError.unauthorized('The account linked to this token no longer exists.');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');
  if (user.passwordChangedAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again.');
  }

  req.user = user;
  return next();
});

/**
 * Attaches req.user when a valid token is present but never blocks the request.
 * Used by public endpoints that personalize their response (e.g. flagging the
 * viewer's own review on a product page).
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.sub).select('+passwordChangedAt');
    if (user && user.isActive && !user.passwordChangedAfter(decoded.iat)) {
      req.user = user;
    }
  } catch {
    // An invalid token on a public route is simply treated as anonymous.
  }

  return next();
});

/** Role gate. Use after `protect`. */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized('Authentication required.'));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('This action requires elevated permissions.'));
    }
    return next();
  };

export const adminOnly = authorize(ROLES.ADMIN);

export default protect;
