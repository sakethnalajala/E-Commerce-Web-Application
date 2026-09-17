import mongoose from 'mongoose';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/ApiResponse.js';
import { placeOrder, applyStatusChange } from '../services/order.service.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { ORDER_STATUS, CUSTOMER_CANCELLABLE_STATUSES, ROLES } from '../utils/constants.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildOrderFilter = (query = {}) => {
  const filter = {};

  if (query.status) filter.status = query.status;

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) {
      const to = new Date(query.to);
      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (query.search) {
    filter.orderNumber = new RegExp(escapeRegex(query.search.trim()), 'i');
  }

  return filter;
};

/** POST /orders — simple checkout, no payment gateway. */
export const createOrder = asyncHandler(async (req, res) => {
  const { fullName, phone, addressLine, city, state, postalCode, country } = req.body;

  const order = await placeOrder({
    user: req.user,
    shipping: {
      fullName,
      phone,
      addressLine,
      city,
      state,
      postalCode,
      country: country || 'India',
    },
  });

  return sendCreated(res, {
    message: `Order ${order.orderNumber} placed successfully.`,
    data: { order },
  });
});

/** GET /orders/my — the authenticated customer's own orders. */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { ...buildOrderFilter(req.query), user: req.user._id };

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    message: orders.length ? 'Orders loaded.' : 'You have not placed any orders yet.',
    data: { orders },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * GET /orders/:id
 * Customers may only read their own orders; admins may read any order.
 */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone createdAt')
    .populate('statusHistory.changedBy', 'name role');

  if (!order) throw ApiError.notFound('Order not found.');

  const isOwner = order.user?._id?.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only view your own orders.');
  }

  return sendSuccess(res, { message: 'Order loaded.', data: { order } });
});

/**
 * PATCH /orders/:id/cancel
 * Customers can cancel their own order while it is still Pending or Confirmed.
 */
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  if (order.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only cancel your own orders.');
  }

  if (!CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)) {
    throw ApiError.badRequest(
      `An order that is already "${order.status}" can no longer be cancelled. Please contact support.`
    );
  }

  const updated = await applyStatusChange(order, {
    status: ORDER_STATUS.CANCELLED,
    note: 'Cancelled by customer',
    reason: req.body.reason ?? '',
    changedBy: req.user._id,
  });

  return sendSuccess(res, {
    message: `Order ${updated.orderNumber} was cancelled and the stock was released.`,
    data: { order: updated },
  });
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** GET /orders — all orders with filters and pagination. */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildOrderFilter(req.query);

  const [orders, total, statusCounts] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  return sendSuccess(res, {
    message: 'Orders loaded.',
    data: {
      orders,
      statusCounts: statusCounts.reduce((acc, entry) => ({ ...acc, [entry._id]: entry.count }), {}),
    },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/** PATCH /orders/:id/status — admin-only workflow transition. */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const updated = await applyStatusChange(order, {
    status,
    note: note ?? `Status changed to ${status} by admin`,
    changedBy: req.user._id,
  });

  await updated.populate('user', 'name email phone');

  return sendSuccess(res, {
    message: `Order ${updated.orderNumber} is now "${updated.status}".`,
    data: { order: updated },
  });
});

/** GET /orders/user/:userId — every order for one customer (admin view). */
export const getOrdersByUser = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { user: req.params.userId };

  const [orders, total, summary] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.params.userId) } },
      {
        $group: {
          _id: null,
          totalSpent: {
            $sum: { $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$totalPrice', 0] },
          },
          orders: { $sum: 1 },
        },
      },
    ]),
  ]);

  return sendSuccess(res, {
    message: 'Customer orders loaded.',
    data: {
      orders,
      summary: {
        totalOrders: summary[0]?.orders ?? 0,
        totalSpent: Math.round((summary[0]?.totalSpent ?? 0) * 100) / 100,
      },
    },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
