import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { ORDER_STATUS, ORDER_STATUS_VALUES, LOW_STOCK_THRESHOLD, ROLES } from '../utils/constants.js';

/**
 * Cancelled orders are excluded from every revenue figure; delivered orders are
 * tracked separately as realized revenue.
 */
const REVENUE_MATCH = { status: { $ne: ORDER_STATUS.CANCELLED } };

const round = (value) => Math.round(((value ?? 0) + Number.EPSILON) * 100) / 100;

const daysAgo = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
};

/** Dashboard header: totals, revenue and the latest orders. */
export const getDashboardOverview = async () => {
  const [
    totalCustomers,
    totalProducts,
    totalCategories,
    totalOrders,
    revenueAgg,
    deliveredAgg,
    pendingCount,
    recentOrders,
    lowStockCount,
    outOfStockCount,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.CUSTOMER }),
    Product.countDocuments({}),
    Category.countDocuments({}),
    Order.countDocuments({}),
    Order.aggregate([
      { $match: REVENUE_MATCH },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED } },
      { $group: { _id: null, revenue: { $sum: '$totalPrice' } } },
    ]),
    Order.countDocuments({ status: ORDER_STATUS.PENDING }),
    Order.find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name email')
      .select('orderNumber totalPrice status createdAt totalQuantity user')
      .lean(),
    Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    Product.countDocuments({ stock: { $lte: 0 } }),
  ]);

  const revenue = round(revenueAgg[0]?.revenue);
  const payingOrders = revenueAgg[0]?.orders ?? 0;

  return {
    totals: {
      customers: totalCustomers,
      products: totalProducts,
      categories: totalCategories,
      orders: totalOrders,
      revenue,
      deliveredRevenue: round(deliveredAgg[0]?.revenue),
      averageOrderValue: payingOrders ? round(revenue / payingOrders) : 0,
      pendingOrders: pendingCount,
      lowStockProducts: lowStockCount,
      outOfStockProducts: outOfStockCount,
    },
    recentOrders,
  };
};

/** Revenue + order count per day for the requested window. */
export const getSalesAnalytics = async ({ days = 30 } = {}) => {
  const startDate = daysAgo(days);

  const [timeline, monthly, summary] = await Promise.all([
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          units: { $sum: '$totalQuantity' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', revenue: { $round: ['$revenue', 2] }, orders: 1, units: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: daysAgo(365) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', revenue: { $round: ['$revenue', 2] }, orders: 1 } },
    ]),
    Order.aggregate([
      { $match: { ...REVENUE_MATCH, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          units: { $sum: '$totalQuantity' },
          itemsRevenue: { $sum: '$itemsPrice' },
          shipping: { $sum: '$shippingPrice' },
          tax: { $sum: '$taxPrice' },
        },
      },
    ]),
  ]);

  const stats = summary[0] ?? {};

  return {
    rangeDays: days,
    timeline,
    monthly,
    summary: {
      revenue: round(stats.revenue),
      orders: stats.orders ?? 0,
      unitsSold: stats.units ?? 0,
      itemsRevenue: round(stats.itemsRevenue),
      shippingRevenue: round(stats.shipping),
      taxCollected: round(stats.tax),
      averageOrderValue: stats.orders ? round(stats.revenue / stats.orders) : 0,
    },
  };
};

/** Order counts and value grouped by status, including zero-count statuses. */
export const getOrderAnalytics = async () => {
  const [grouped, fulfillment] = await Promise.all([
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$totalPrice' } } },
    ]),
    Order.aggregate([
      { $match: { status: ORDER_STATUS.DELIVERED, deliveredAt: { $ne: null } } },
      { $project: { hours: { $divide: [{ $subtract: ['$deliveredAt', '$createdAt'] }, 1000 * 60 * 60] } } },
      { $group: { _id: null, averageHours: { $avg: '$hours' }, sample: { $sum: 1 } } },
    ]),
  ]);

  const byStatusMap = new Map(grouped.map((entry) => [entry._id, entry]));
  const totalOrders = grouped.reduce((sum, entry) => sum + entry.count, 0);

  const byStatus = ORDER_STATUS_VALUES.map((status) => {
    const entry = byStatusMap.get(status);
    const count = entry?.count ?? 0;
    return {
      status,
      count,
      value: round(entry?.value),
      percentage: totalOrders ? Math.round((count / totalOrders) * 1000) / 10 : 0,
    };
  });

  const cancelled = byStatusMap.get(ORDER_STATUS.CANCELLED)?.count ?? 0;
  const delivered = byStatusMap.get(ORDER_STATUS.DELIVERED)?.count ?? 0;

  return {
    totalOrders,
    byStatus,
    cancellationRate: totalOrders ? Math.round((cancelled / totalOrders) * 1000) / 10 : 0,
    fulfillmentRate: totalOrders ? Math.round((delivered / totalOrders) * 1000) / 10 : 0,
    averageDeliveryHours: fulfillment[0]?.averageHours ? round(fulfillment[0].averageHours) : null,
  };
};

/** Best sellers by units sold, derived from actual order lines. */
export const getTopProducts = async ({ limit = 10 } = {}) => {
  const topProducts = await Order.aggregate([
    { $match: REVENUE_MATCH },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        image: { $first: '$items.image' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { unitsSold: -1, revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        name: 1,
        image: 1,
        unitsSold: 1,
        orders: 1,
        revenue: { $round: ['$revenue', 2] },
        stock: { $ifNull: [{ $first: '$product.stock' }, 0] },
        slug: { $first: '$product.slug' },
      },
    },
  ]);

  const byCategory = await Order.aggregate([
    { $match: REVENUE_MATCH },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'products',
        localField: 'items.product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'categories',
        localField: 'product.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $group: {
        _id: '$category.name',
        revenue: { $sum: '$items.subtotal' },
        unitsSold: { $sum: '$items.quantity' },
      },
    },
    { $sort: { revenue: -1 } },
    { $project: { _id: 0, category: '$_id', revenue: { $round: ['$revenue', 2] }, unitsSold: 1 } },
  ]);

  return { topProducts, byCategory };
};

/** Customer growth, spend distribution and the highest-value customers. */
export const getUserAnalytics = async ({ months = 6 } = {}) => {
  const since = daysAgo(months * 30);

  const [totals, growth, topCustomers, orderedCustomerAgg] = await Promise.all([
    User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, month: '$_id', newUsers: 1 } },
    ]),
    Order.aggregate([
      { $match: REVENUE_MATCH },
      {
        $group: {
          _id: '$user',
          orders: { $sum: 1 },
          totalSpent: { $sum: '$totalPrice' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          orders: 1,
          lastOrderAt: 1,
          totalSpent: { $round: ['$totalSpent', 2] },
        },
      },
    ]),
    Order.aggregate([{ $group: { _id: '$user' } }, { $count: 'count' }]),
  ]);

  const customers = totals.find((entry) => entry._id === ROLES.CUSTOMER);
  const admins = totals.find((entry) => entry._id === ROLES.ADMIN);
  const totalCustomers = customers?.count ?? 0;
  const customersWithOrders = orderedCustomerAgg[0]?.count ?? 0;

  return {
    totals: {
      customers: totalCustomers,
      activeCustomers: customers?.active ?? 0,
      admins: admins?.count ?? 0,
      customersWithOrders,
      conversionRate: totalCustomers
        ? Math.round((customersWithOrders / totalCustomers) * 1000) / 10
        : 0,
    },
    growth,
    topCustomers,
  };
};

/** Inventory health: stock levels, value and per-category distribution. */
export const getInventoryAnalytics = async ({ lowStockThreshold = LOW_STOCK_THRESHOLD } = {}) => {
  const [totals, lowStock, outOfStock, byCategory, reviewStats] = await Promise.all([
    Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
          availableInventory: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$stock', '$effectivePrice'] } },
          lowStock: {
            $sum: { $cond: [{ $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', lowStockThreshold] }] }, 1, 0] },
          },
          outOfStock: { $sum: { $cond: [{ $lte: ['$stock', 0] }, 1, 0] } },
          unitsSold: { $sum: '$sold' },
        },
      },
    ]),
    Product.find({ stock: { $gt: 0, $lte: lowStockThreshold } })
      .sort({ stock: 1 })
      .limit(15)
      .select('name slug stock effectivePrice images brand')
      .populate('category', 'name')
      .lean(),
    Product.find({ stock: { $lte: 0 } })
      .sort({ updatedAt: -1 })
      .limit(15)
      .select('name slug stock effectivePrice images brand')
      .populate('category', 'name')
      .lean(),
    Product.aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ['$category.name', 'Uncategorized'] },
          products: { $sum: 1 },
          stock: { $sum: '$stock' },
          inventoryValue: { $sum: { $multiply: ['$stock', '$effectivePrice'] } },
        },
      },
      { $sort: { products: -1 } },
      {
        $project: {
          _id: 0,
          category: '$_id',
          products: 1,
          stock: 1,
          inventoryValue: { $round: ['$inventoryValue', 2] },
        },
      },
    ]),
    Review.aggregate([
      { $group: { _id: null, totalReviews: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
    ]),
  ]);

  const stats = totals[0] ?? {};

  return {
    lowStockThreshold,
    totals: {
      totalProducts: stats.totalProducts ?? 0,
      activeProducts: stats.activeProducts ?? 0,
      availableInventory: stats.availableInventory ?? 0,
      inventoryValue: round(stats.inventoryValue),
      lowStockProducts: stats.lowStock ?? 0,
      outOfStockProducts: stats.outOfStock ?? 0,
      unitsSold: stats.unitsSold ?? 0,
      totalReviews: reviewStats[0]?.totalReviews ?? 0,
      averageRating: round(reviewStats[0]?.averageRating),
    },
    lowStock,
    outOfStock,
    byCategory,
  };
};

/** One call that powers the whole analytics page. */
export const getAnalyticsSnapshot = async ({ days = 30 } = {}) => {
  const [overview, sales, orders, products, users, inventory] = await Promise.all([
    getDashboardOverview(),
    getSalesAnalytics({ days }),
    getOrderAnalytics(),
    getTopProducts({ limit: 10 }),
    getUserAnalytics({ months: 6 }),
    getInventoryAnalytics({}),
  ]);

  return { overview, sales, orders, products, users, inventory };
};
