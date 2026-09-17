import { env } from './env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * Allow-list based CORS. Production only ever accepts the configured frontend
 * origins (Vercel) — never a wildcard.
 */
const buildAllowedOrigins = () => {
  const origins = new Set([env.clientUrl, ...env.additionalCorsOrigins]);

  if (!env.isProduction) {
    ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'].forEach((origin) =>
      origins.add(origin)
    );
  }

  return [...origins].filter(Boolean);
};

export const allowedOrigins = buildAllowedOrigins();

// Vercel preview deployments (my-app-git-branch-user.vercel.app) only pass when
// ADDITIONAL_CORS_ORIGINS explicitly opts in with the "*.vercel.app" entry.
const previewOriginsAllowed = env.additionalCorsOrigins.includes('*.vercel.app');
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9][a-z0-9-]*\.vercel\.app$/i;

export const corsOptions = {
  origin(origin, callback) {
    // Same-origin / server-to-server calls (Postman, curl, health checks) send no Origin header.
    if (!origin) return callback(null, true);

    const normalized = origin.replace(/\/+$/, '');

    if (allowedOrigins.includes(normalized)) return callback(null, true);
    if (previewOriginsAllowed && VERCEL_PREVIEW_PATTERN.test(normalized)) return callback(null, true);

    // A blocked origin reaches the browser as an opaque network failure
    // ("cannot reach the server"), so say plainly in the logs what was
    // rejected and what is allowed — otherwise this is very hard to diagnose
    // from the deployed frontend alone.
    logger.warn(
      `CORS rejected origin "${normalized}". Allowed: ${allowedOrigins.join(', ') || '(none)'}. ` +
        'Set CLIENT_URL (or ADDITIONAL_CORS_ORIGINS) to include this origin.'
    );

    return callback(ApiError.forbidden(`Origin ${origin} is not allowed by the CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  // Retry-After is not CORS-safelisted; without exposing it the browser hides
  // it from the client, which then cannot show a real countdown on a 429.
  exposedHeaders: ['X-Total-Count', 'Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset'],
  maxAge: 86400,
};

export default corsOptions;
