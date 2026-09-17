/**
 * The public "demo customer" offered on the login page.
 *
 * The credentials are configured on the server (env.demoLogin) and handed to
 * the frontend at runtime, so nothing is compiled into the browser bundle.
 * Before advertising them this verifies against the database that the account
 * really exists, is active, is a *customer*, and that the password actually
 * works — a demo button that fails is worse than no button, and an
 * administrator must never be offered this way.
 *
 * The check is cached for the process: it costs one bcrypt comparison, and
 * the answer only changes when the account or the configuration changes.
 */
import User from '../models/User.js';
import { env } from '../config/env.js';
import { ROLES } from '../utils/constants.js';
import logger from '../utils/logger.js';

const cache = new Map();

/**
 * Validates one configured demo account against the database.
 * `expectedRole` is enforced, so a customer entry can never hand out admin
 * access and an admin entry is only ever offered on the admin sign-in page.
 */
const resolveDemo = async ({ key, enabled, email, password, expectedRole }) => {
  if (cache.has(key)) return cache.get(key);

  const cached = (value) => {
    cache.set(key, value);
    return value;
  };

  if (!enabled || !email || !password) return cached(null);

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      logger.warn(`Demo ${key} login disabled: no account for "${email}". Run the seed to create it.`);
      return cached(null);
    }
    if (user.role !== expectedRole) {
      // Hard stop: the advertised account must be exactly the role claimed.
      logger.warn(`Demo ${key} login disabled: "${email}" is not a ${expectedRole} account.`);
      return cached(null);
    }
    if (!user.isActive) {
      logger.warn(`Demo ${key} login disabled: "${email}" is deactivated.`);
      return cached(null);
    }
    if (!(await user.comparePassword(password))) {
      logger.warn(
        `Demo ${key} login disabled: the configured password for "${email}" does not match the stored hash.`
      );
      return cached(null);
    }

    return cached({ email: user.email, password });
  } catch (error) {
    // Never let this optional convenience break the providers endpoint.
    logger.error(`Demo ${key} login check failed: ${error.message}`);
    return cached(null);
  }
};

export const resolveDemoCustomer = () =>
  resolveDemo({
    key: 'customer',
    enabled: env.demoLogin.enabled,
    email: env.demoLogin.email,
    password: env.demoLogin.password,
    expectedRole: ROLES.CUSTOMER,
  });

/** Offered only on the admin sign-in page; disable with DEMO_ADMIN_ENABLED=false. */
export const resolveDemoAdmin = () =>
  resolveDemo({
    key: 'admin',
    enabled: env.demoLogin.enabled && env.demoLogin.adminEnabled,
    email: env.demoLogin.adminEmail,
    password: env.demoLogin.adminPassword,
    expectedRole: ROLES.ADMIN,
  });

/** Test seam / used after a reseed changes the accounts. */
export const resetDemoCache = () => cache.clear();

export default resolveDemoCustomer;
