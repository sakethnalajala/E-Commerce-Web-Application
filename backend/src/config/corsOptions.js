import { env } from './env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

/**
 * This project's own published frontends. CLIENT_URL and ADDITIONAL_CORS_ORIGINS
 * are still the way to configure a deployment, but these are trusted by default
 * because an unset CLIENT_URL silently falls back to http://localhost:5173 —
 * which blocks the real site and shows up in the browser only as an opaque
 * "cannot reach the server", with no CORS error the user can act on.
 *
 * These are public website addresses, not secrets. Anything else (a fork, a
 * custom domain) is added through the environment.
 */
const KNOWN_PRODUCTION_ORIGINS = ['https://e-commerce-web-application-ashen.vercel.app'];

/**
 * Allow-list based CORS. Production only ever accepts known frontend
 * origins (Vercel) — never a wildcard.
 */
const buildAllowedOrigins = () => {
  const origins = new Set([env.clientUrl, ...env.additionalCorsOrigins, ...KNOWN_PRODUCTION_ORIGINS]);

  if (!env.isProduction) {
    ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'].forEach((origin) =>
      origins.add(origin)
    );
  }

  return [...origins].filter(Boolean).map((origin) => origin.replace(/\/+$/, ''));
};

export const allowedOrigins = buildAllowedOrigins();

/**
 * Vercel gives every deployment its own hostname
 * (my-app-<hash>-<scope>.vercel.app), so a per-deployment URL can never be
 * pinned in CLIENT_URL. ADDITIONAL_CORS_ORIGINS opts into the whole
 * *.vercel.app space; both "*.vercel.app" and "https://*.vercel.app" are
 * accepted because either spelling is natural to write and getting it subtly
 * wrong fails silently in the browser.
 */
const VERCEL_WILDCARDS = ['*.vercel.app', 'https://*.vercel.app', 'http://*.vercel.app'];
const previewOriginsAllowed = env.additionalCorsOrigins.some((entry) =>
  VERCEL_WILDCARDS.includes(entry.trim().toLowerCase().replace(/\/+$/, ''))
);
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
