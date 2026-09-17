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

let cached;

export const resolveDemoCustomer = async () => {
  if (cached !== undefined) return cached;

  const { enabled, email, password } = env.demoLogin;
  if (!enabled || !email || !password) {
    cached = null;
    return cached;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      logger.warn(`Demo login disabled: no account for "${email}". Run the seed to create it.`);
      cached = null;
    } else if (user.role !== ROLES.CUSTOMER) {
      // Hard stop: this feature exists to showcase the storefront, never to
      // hand out elevated access.
      logger.warn(`Demo login disabled: "${email}" is not a customer account.`);
      cached = null;
    } else if (!user.isActive) {
      logger.warn(`Demo login disabled: "${email}" is deactivated.`);
      cached = null;
    } else if (!(await user.comparePassword(password))) {
      logger.warn(
        `Demo login disabled: the configured password for "${email}" does not match the stored hash. ` +
          'Set DEMO_CUSTOMER_PASSWORD to the seeded value.'
      );
      cached = null;
    } else {
      cached = { email: user.email, password };
    }
  } catch (error) {
    // Never let this optional convenience break the providers endpoint.
    logger.error(`Demo login check failed: ${error.message}`);
    cached = null;
  }

  return cached;
};

/** Test seam / used after a reseed changes the account. */
export const resetDemoCustomerCache = () => {
  cached = undefined;
};

export default resolveDemoCustomer;
