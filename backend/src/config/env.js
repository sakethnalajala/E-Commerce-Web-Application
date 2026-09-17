import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

const toList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: toNumber(process.env.PORT, 5000),
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  mongoUri: process.env.MONGODB_URI,
  // Always connect to this database, even when the Atlas URI has no path
  // segment (the default "Connect" string from Atlas omits it). Keeps this app
  // isolated from any other database on the same cluster.
  mongoDbName: (process.env.MONGODB_DB_NAME || 'ecommerce_db').trim(),
  useMemoryDb: toBoolean(process.env.USE_MEMORY_DB, false),

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  bcryptSaltRounds: toNumber(process.env.BCRYPT_SALT_ROUNDS, 12),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'ecommerce/products',
  },

  /**
   * Social sign-in. Only the *client IDs* are public (they ship to the
   * browser via GET /auth/providers); the Google client secret stays here.
   * A provider is enabled only when its client ID is set.
   */
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
    apple: {
      // The Services ID (e.g. com.example.shopsphere.web), used as the JWT audience.
      clientId: process.env.APPLE_CLIENT_ID || '',
      // Must match a Return URL registered for the Services ID (https only).
      redirectUri: process.env.APPLE_REDIRECT_URI || '',
    },
  },

  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, ''),
  serverUrl: (process.env.SERVER_URL || 'http://localhost:5000').replace(/\/+$/, ''),
  // Extra origins (comma separated) allowed to call the API, e.g. Vercel preview deployments.
  additionalCorsOrigins: toList(process.env.ADDITIONAL_CORS_ORIGINS),

  passwordReset: {
    // Minutes a password-reset token stays valid.
    expiresInMinutes: toNumber(process.env.RESET_TOKEN_EXPIRES_MINUTES, 15),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: toBoolean(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'E-Commerce Support <no-reply@ecommerce.local>',
  },

  rateLimit: {
    windowMinutes: toNumber(process.env.RATE_LIMIT_WINDOW_MINUTES, 15),
    // Production keeps the tight limits. Development gets generous ones: React
    // StrictMode double-fires every fetch, Vite hot-reloads and a single
    // developer's browsing easily exceeds 300 requests in 15 minutes, which
    // surfaced as "Too many requests" on the storefront. Explicit env values
    // always win.
    maxRequests: toNumber(process.env.RATE_LIMIT_MAX, process.env.NODE_ENV === 'production' ? 300 : 3000),
    authMaxRequests: toNumber(process.env.AUTH_RATE_LIMIT_MAX, process.env.NODE_ENV === 'production' ? 30 : 100),
  },

  order: {
    // Server-side pricing rules. The client never supplies these.
    freeShippingThreshold: toNumber(process.env.FREE_SHIPPING_THRESHOLD, 999),
    shippingFee: toNumber(process.env.SHIPPING_FEE, 49),
    taxRate: toNumber(process.env.TAX_RATE, 0.05),
  },
};

/**
 * Fails fast at boot when mandatory configuration is missing, so the app never
 * starts in a half-configured state.
 */
export const assertRequiredEnv = () => {
  const missing = [];

  if (!env.jwt.secret || env.jwt.secret.length < 32) {
    missing.push('JWT_SECRET (must be set and at least 32 characters)');
  }

  if (!env.mongoUri && !(env.useMemoryDb && !env.isProduction)) {
    missing.push(
      'MONGODB_URI (your MongoDB Atlas connection string, e.g. ' +
        'mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority)'
    );
  }

  if (!/^[A-Za-z0-9_-]{1,63}$/.test(env.mongoDbName)) {
    missing.push('MONGODB_DB_NAME (letters, digits, "_" or "-" only; defaults to ecommerce_db)');
  }

  if (env.isProduction) {
    if (!env.clientUrl) missing.push('CLIENT_URL');
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    if (!cloudName || !apiKey || !apiSecret) {
      missing.push('CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET');
    }
  }

  if (missing.length) {
    throw new Error(
      `Missing required environment variables:\n  - ${missing.join('\n  - ')}\n` +
        'Copy .env.example to .env and fill in the values.'
    );
  }
};

export default env;
