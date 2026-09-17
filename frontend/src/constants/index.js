export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ShopSphere';

export const STORAGE_KEYS = {
  token: 'shopsphere.token',
  user: 'shopsphere.user',
  guestCart: 'shopsphere.guestCart',
  theme: 'shopsphere.theme',
};

export const ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
};

export const ORDER_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

/** Mirrors the transitions the API enforces, so the UI only offers valid moves. */
export const ORDER_STATUS_FLOW = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const ORDER_STATUS_STYLES = {
  [ORDER_STATUS.PENDING]: 'bg-warning-50 text-warning-700 ring-warning-500/20',
  [ORDER_STATUS.CONFIRMED]: 'bg-brand-50 text-brand-700 ring-brand-500/20',
  [ORDER_STATUS.SHIPPED]: 'bg-sky-50 text-sky-700 ring-sky-500/20',
  [ORDER_STATUS.DELIVERED]: 'bg-success-50 text-success-700 ring-success-500/20',
  [ORDER_STATUS.CANCELLED]: 'bg-danger-50 text-danger-700 ring-danger-500/20',
};

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'popular', label: 'Most popular' },
];

export const PAGE_SIZE = 24;
export const ADMIN_PAGE_SIZE = 10;

export const CURRENCY = { locale: 'en-IN', code: 'INR' };

/**
 * Demo logins are strictly opt-in: nothing appears unless
 * VITE_ENABLE_DEMO_LOGIN is "true" AND the matching credentials are supplied.
 * Values come from VITE_* variables, never from source.
 *
 * The customer demo may be enabled on a deployed build — a public showcase
 * account signing in through the normal /auth/login endpoint. The admin demo
 * is additionally gated on `import.meta.env.DEV` (a build-time constant, so
 * the literals are eliminated from a production bundle): administrator
 * credentials must never ship to a public site.
 */
const demoEnabled = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const adminDemoEnabled = demoEnabled && import.meta.env.DEV;

export const DEMO_ACCOUNTS = {
  enabled: demoEnabled,
  customer:
    demoEnabled && import.meta.env.VITE_DEMO_CUSTOMER_EMAIL && import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD
      ? { email: import.meta.env.VITE_DEMO_CUSTOMER_EMAIL, password: import.meta.env.VITE_DEMO_CUSTOMER_PASSWORD }
      : null,
  admin:
    adminDemoEnabled && import.meta.env.VITE_DEMO_ADMIN_EMAIL && import.meta.env.VITE_DEMO_ADMIN_PASSWORD
      ? { email: import.meta.env.VITE_DEMO_ADMIN_EMAIL, password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD }
      : null,
};

/** Where each role lands after a successful login. */
export const HOME_FOR_ROLE = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.CUSTOMER]: '/dashboard',
};

/**
 * Social sign-in is UI-only until an OAuth backend exists. Flip a provider to
 * `true` only after wiring a real, server-side OAuth flow.
 */
/** Social providers in display order. Whether each is *enabled* comes from GET /auth/providers. */
export const SOCIAL_PROVIDERS = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
];
