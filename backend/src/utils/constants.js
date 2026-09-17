export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  ADMIN: 'admin',
});

export const ORDER_STATUS = Object.freeze({
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
});

export const ORDER_STATUS_VALUES = Object.values(ORDER_STATUS);

/**
 * Allowed admin status transitions. An order can always be cancelled until it
 * has shipped; a delivered or cancelled order is terminal.
 */
export const ORDER_STATUS_FLOW = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

// Statuses a customer may cancel their own order from.
export const CUSTOMER_CANCELLABLE_STATUSES = [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED];

// Statuses whose stock has been deducted and must be returned when cancelling.
export const STOCK_RESTORING_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
];

export const SORT_OPTIONS = Object.freeze({
  'price-asc': { effectivePrice: 1, _id: 1 },
  'price-desc': { effectivePrice: -1, _id: 1 },
  newest: { createdAt: -1, _id: 1 },
  oldest: { createdAt: 1, _id: 1 },
  rating: { ratingsAverage: -1, ratingsCount: -1, _id: 1 },
  popular: { sold: -1, _id: 1 },
});

export const DEFAULT_SORT = 'newest';

export const LOW_STOCK_THRESHOLD = 10;

export const MAX_PRODUCT_IMAGES = 6;
