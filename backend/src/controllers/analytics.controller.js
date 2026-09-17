import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import {
  getDashboardOverview,
  getSalesAnalytics,
  getOrderAnalytics,
  getTopProducts,
  getUserAnalytics,
  getInventoryAnalytics,
  getAnalyticsSnapshot,
} from '../services/analytics.service.js';
import { LOW_STOCK_THRESHOLD } from '../utils/constants.js';

const parseDays = (value, fallback = 30) => {
  const days = Number.parseInt(value, 10);
  if (!Number.isFinite(days)) return fallback;
  return Math.min(365, Math.max(1, days));
};

/** GET /analytics/dashboard */
export const getDashboard = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Dashboard loaded.', data: await getDashboardOverview() })
);

/** GET /analytics/sales?days=30 */
export const getSales = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Sales analytics loaded.',
    data: await getSalesAnalytics({ days: parseDays(req.query.days) }),
  })
);

/** GET /analytics/orders */
export const getOrders = asyncHandler(async (_req, res) =>
  sendSuccess(res, { message: 'Order analytics loaded.', data: await getOrderAnalytics() })
);

/** GET /analytics/products?limit=10 */
export const getProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));

  return sendSuccess(res, {
    message: 'Product analytics loaded.',
    data: await getTopProducts({ limit }),
  });
});

/** GET /analytics/users?months=6 */
export const getUsers = asyncHandler(async (req, res) => {
  const months = Math.min(24, Math.max(1, Number.parseInt(req.query.months, 10) || 6));

  return sendSuccess(res, {
    message: 'Customer analytics loaded.',
    data: await getUserAnalytics({ months }),
  });
});

/** GET /analytics/inventory?lowStockThreshold=10 */
export const getInventory = asyncHandler(async (req, res) => {
  const lowStockThreshold = Math.max(
    1,
    Number.parseInt(req.query.lowStockThreshold, 10) || LOW_STOCK_THRESHOLD
  );

  return sendSuccess(res, {
    message: 'Inventory analytics loaded.',
    data: await getInventoryAnalytics({ lowStockThreshold }),
  });
});

/** GET /analytics/overview — everything the analytics page needs in one call. */
export const getOverview = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Analytics snapshot loaded.',
    data: await getAnalyticsSnapshot({ days: parseDays(req.query.days) }),
  })
);
