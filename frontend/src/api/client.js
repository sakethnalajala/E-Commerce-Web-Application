import axios from 'axios';
import { STORAGE_KEYS } from '@/constants';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/* Attach the bearer token to every request. */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Let the browser set the multipart boundary itself.
  if (config.data instanceof FormData) delete config.headers['Content-Type'];

  return config;
});

/** Subscribers notified when the server rejects our token. */
const unauthorizedHandlers = new Set();
export const onUnauthorized = (handler) => {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
};

/**
 * Normalizes every failure into an Error carrying `status`, a readable
 * `message` and any `fieldErrors`, so components never have to dig through
 * axios internals.
 */
const normalizeError = (error) => {
  if (axios.isCancel(error)) {
    const cancelled = new Error('Request cancelled');
    cancelled.cancelled = true;
    return cancelled;
  }

  if (error.code === 'ECONNABORTED') {
    const timeout = new Error('The server took too long to respond. Please try again.');
    timeout.status = 0;
    return timeout;
  }

  if (!error.response) {
    const offline = new Error(
      'Cannot reach the server. Check your internet connection and try again.'
    );
    offline.status = 0;
    offline.isNetworkError = true;
    return offline;
  }

  const { status, data, headers } = error.response;
  const normalized = new Error(data?.message || 'Something went wrong. Please try again.');
  normalized.status = status;
  if (status === 429) {
    // The API sends Retry-After in seconds; components use it for a countdown.
    const retryAfter = Number(headers?.['retry-after']);
    normalized.isRateLimited = true;
    normalized.retryAfterSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
  }
  normalized.fieldErrors = (data?.errors ?? []).reduce(
    (acc, item) => ({ ...acc, [item.field]: item.message }),
    {}
  );
  normalized.raw = data;

  return normalized;
};

/* ------------------------------------------------------------------ */
/* GET de-duplication and short-lived caching                          */
/* ------------------------------------------------------------------ */
/**
 * Two problems this solves:
 *  1. React StrictMode mounts effects twice in development, and several
 *     components (navbar, footer, home) need the same data — without this,
 *     one page load fired the same request 2–4 times and tripped the API's
 *     rate limiter.
 *  2. Navigating back to a page re-fetched everything it had just shown.
 *
 * Identical GETs in flight share one promise; a successful response is kept
 * for `GET_CACHE_TTL_MS` and served to repeat callers. Any mutation (POST,
 * PUT, PATCH, DELETE) or an explicit `invalidateGetCache()` — called on
 * login/logout and by `reload()` in useApiResource — drops everything, so
 * stale reads after a change are impossible. Pass `{ cache: false }` in the
 * request config to bypass it for a single call.
 */
const GET_CACHE_TTL_MS = 30 * 1000;
const inFlight = new Map();
const cached = new Map();

const cacheKey = (config) => {
  const params = config.params ? JSON.stringify(config.params, Object.keys(config.params).sort()) : '';
  const token = localStorage.getItem(STORAGE_KEYS.token) ? 'auth' : 'anon';
  return `${token}:${config.url}?${params}`;
};

export const invalidateGetCache = () => {
  cached.clear();
};

const originalGet = client.get.bind(client);
client.get = (url, config = {}) => {
  if (config.cache === false || config.signal) return originalGet(url, config);

  const key = cacheKey({ url, params: config.params });
  const hit = cached.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  if (inFlight.has(key)) return inFlight.get(key);

  const request = originalGet(url, config)
    .then((value) => {
      cached.set(key, { value, expires: Date.now() + GET_CACHE_TTL_MS });
      return value;
    })
    .finally(() => inFlight.delete(key));

  inFlight.set(key, request);
  return request;
};

/* Every successful mutation invalidates cached reads. */
client.interceptors.request.use((config) => {
  if (config.method && config.method.toLowerCase() !== 'get') invalidateGetCache();
  return config;
});

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalized = normalizeError(error);

    // 401 means the session is gone — let the auth layer clear it.
    // A failed login attempt is excluded: that is a credential error, not an
    // expired session.
    const url = error.config?.url ?? '';
    const isLoginAttempt = url.includes('/auth/login');

    if (normalized.status === 401 && !isLoginAttempt) {
      unauthorizedHandlers.forEach((handler) => handler(normalized));
    }

    return Promise.reject(normalized);
  }
);

export default client;
