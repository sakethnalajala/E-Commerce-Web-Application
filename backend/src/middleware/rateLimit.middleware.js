import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Every limiter funnels through the central error handler so 429s look like
 * any other API error. `Retry-After` (seconds) lets the client show a real
 * countdown instead of blindly retrying.
 */
const handler = (req, res, next) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : 60;
  res.setHeader('Retry-After', String(retryAfterSeconds));

  const wait =
    retryAfterSeconds >= 120
      ? `about ${Math.ceil(retryAfterSeconds / 60)} minutes`
      : `${retryAfterSeconds} seconds`;
  next(ApiError.tooManyRequests(`Too many requests from this IP. Please try again in ${wait}.`));
};

/** Health checks and CORS preflights never count against the quota. */
const skip = (req) => req.method === 'OPTIONS' || req.path === '/health';

/** Baseline limiter applied to the whole API. */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  handler,
});

/** Tighter limiter for credential endpoints (login, register, reset). */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});

/** Strictest limiter: password-reset requests are a spam/enumeration vector. */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
