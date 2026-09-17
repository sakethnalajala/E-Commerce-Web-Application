import Order from '../models/Order.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { loadSanitizedCart, buildCartSummary, clearCart } from './cart.service.js';
import {
  ORDER_STATUS,
  ORDER_STATUS_FLOW,
  STOCK_RESTORING_STATUSES,
} from '../utils/constants.js';

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Atomically decrements stock for each line. The `stock: { $gte: quantity }`
 * guard makes the update itself the concurrency check, so two simultaneous
 * checkouts can never oversell the same unit. Anything already reserved is
 * released if a later line fails.
 */
const reserveStock = async (lines) => {
  const reserved = [];

  try {
    for (const line of lines) {
      // eslint-disable-next-line no-await-in-loop
      const updated = await Product.findOneAndUpdate(
        { _id: line.product, isActive: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity, sold: line.quantity } },
        { new: true }
      );

      if (!updated) {
        // eslint-disable-next-line no-await-in-loop
        const current = await Product.findById(line.product).select('name stock isActive').lean();
        if (!current || !current.isActive) {
          throw ApiError.conflict(`"${line.name}" is no longer available. Please update your cart.`);
        }
        throw ApiError.conflict(
          `Only ${current.stock} unit(s) of "${current.name}" remain. Please update your cart.`
        );
      }

      reserved.push(line);
    }

    return reserved;
  } catch (error) {
    await releaseStock(reserved);
    throw error;
  }
};

/** Compensating update used on rollback and on cancellation. */
export const releaseStock = async (lines = []) => {
  if (!lines.length) return;

  await Promise.all(
    lines.map((line) =>
      Product.findByIdAndUpdate(line.product, {
        $inc: { stock: line.quantity, sold: -line.quantity },
      }).catch((error) => logger.error(`Stock release failed for ${line.product}: ${error.message}`))
    )
  );
};

/**
 * Places an order from the authenticated user's persisted cart.
 * Prices, quantities, stock and totals all come from the database — the request
 * body only supplies contact and shipping details.
 */
export const placeOrder = async ({ user, shipping }) => {
  const { cart, notices } = await loadSanitizedCart(user._id);

  if (!cart.items.length) {
    throw ApiError.badRequest(
      notices.length
        ? 'Your cart is no longer valid. Please review the items and try again.'
        : 'Your cart is empty. Add products before checking out.'
    );
  }

  // Sanitization already dropped/clamped anything invalid; surface it rather
  // than charging for a cart the customer has not seen.
  if (notices.length) {
    throw new ApiError(409, 'Your cart changed since you last viewed it. Please review it.', {
      errors: notices.map((notice) => ({ field: 'cart', message: notice.message })),
    });
  }

  const { items, summary } = buildCartSummary(cart);

  const orderItems = items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    image: item.product.image,
    brand: item.product.brand,
    price: item.unitPrice,
    originalPrice: item.product.price,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));

  const reserved = await reserveStock(orderItems);

  try {
    const order = await Order.create({
      user: user._id,
      items: orderItems,
      shippingAddress: shipping,
      itemsPrice: round(summary.subtotal),
      shippingPrice: round(summary.shipping),
      taxPrice: round(summary.tax),
      totalPrice: round(summary.total),
      totalQuantity: summary.totalQuantity,
      status: ORDER_STATUS.PENDING,
      statusHistory: [
        { status: ORDER_STATUS.PENDING, changedBy: user._id, note: 'Order placed by customer' },
      ],
    });

    await clearCart(user._id);

    return order;
  } catch (error) {
    // The order never persisted — give the stock back.
    await releaseStock(reserved);
    throw error;
  }
};

export const assertStatusTransition = (currentStatus, nextStatus) => {
  if (currentStatus === nextStatus) {
    throw ApiError.badRequest(`The order is already marked as ${nextStatus}.`);
  }

  const allowed = ORDER_STATUS_FLOW[currentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(
      allowed.length
        ? `An order in "${currentStatus}" can only move to ${allowed.join(' or ')}. "${nextStatus}" is not allowed.`
        : `"${currentStatus}" is a final status, so this order can no longer be changed.`
    );
  }
};

const STATUS_TIMESTAMP_FIELD = {
  [ORDER_STATUS.CONFIRMED]: 'confirmedAt',
  [ORDER_STATUS.SHIPPED]: 'shippedAt',
  [ORDER_STATUS.DELIVERED]: 'deliveredAt',
  [ORDER_STATUS.CANCELLED]: 'cancelledAt',
};

/** Applies a validated status change, restoring stock when cancelling. */
export const applyStatusChange = async (order, { status, note = '', changedBy, reason = '' }) => {
  assertStatusTransition(order.status, status);

  if (status === ORDER_STATUS.CANCELLED) {
    if (STOCK_RESTORING_STATUSES.includes(order.status)) {
      await releaseStock(order.items.map((item) => ({ product: item.product, quantity: item.quantity })));
    }
    order.cancellationReason = reason || note || 'Cancelled';
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[status];
  if (timestampField) order[timestampField] = new Date();

  order.status = status;
  order.statusHistory.push({ status, changedBy, note, changedAt: new Date() });

  await order.save();
  return order;
};
