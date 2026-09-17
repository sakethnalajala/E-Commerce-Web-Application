import Cart from '../models/Cart.js';
import { env } from '../config/env.js';

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const PRODUCT_FIELDS = 'name slug price discountPrice effectivePrice images stock brand isActive category';

export const getOrCreateCart = async (userId) => {
  const existing = await Cart.findOne({ user: userId });
  if (existing) return existing;
  return Cart.create({ user: userId, items: [] });
};

/**
 * Loads the cart with its products and repairs it against the live catalogue:
 *  - items whose product was deleted or deactivated are dropped
 *  - quantities above the remaining stock are clamped down
 * Every adjustment is reported back as a notice so the UI can tell the customer
 * what changed instead of silently altering their cart.
 */
export const loadSanitizedCart = async (userId) => {
  const cart = await getOrCreateCart(userId);
  await cart.populate({ path: 'items.product', select: PRODUCT_FIELDS });

  const notices = [];
  const keptItems = [];
  let mutated = false;

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      notices.push({
        type: 'removed',
        message: `"${product?.name ?? 'A product'}" is no longer available and was removed from your cart.`,
      });
      mutated = true;
      continue;
    }

    if (product.stock <= 0) {
      notices.push({
        type: 'out-of-stock',
        productId: product._id,
        message: `"${product.name}" is out of stock and was removed from your cart.`,
      });
      mutated = true;
      continue;
    }

    if (item.quantity > product.stock) {
      notices.push({
        type: 'quantity-adjusted',
        productId: product._id,
        message: `Only ${product.stock} left of "${product.name}" — quantity was reduced.`,
      });
      item.quantity = product.stock;
      mutated = true;
    }

    keptItems.push(item);
  }

  if (mutated) {
    cart.items = keptItems;
    await cart.save();
    await cart.populate({ path: 'items.product', select: PRODUCT_FIELDS });
  }

  return { cart, notices };
};

/** Server-side money math. The client never supplies any of these numbers. */
export const buildCartSummary = (cart) => {
  const items = cart.items
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;
      const unitPrice = product.effectivePrice ?? product.discountPrice ?? product.price;

      return {
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url ?? '',
          brand: product.brand,
          price: product.price,
          discountPrice: product.discountPrice,
          effectivePrice: unitPrice,
          stock: product.stock,
        },
        quantity: item.quantity,
        unitPrice: round(unitPrice),
        subtotal: round(unitPrice * item.quantity),
        maxQuantity: product.stock,
      };
    });

  const subtotal = round(items.reduce((sum, item) => sum + item.subtotal, 0));
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const savings = round(
    items.reduce((sum, item) => {
      const original = item.product.price ?? item.unitPrice;
      return sum + Math.max(0, original - item.unitPrice) * item.quantity;
    }, 0)
  );

  const shipping =
    items.length === 0 || subtotal >= env.order.freeShippingThreshold ? 0 : env.order.shippingFee;
  const tax = round(subtotal * env.order.taxRate);
  const total = round(subtotal + shipping + tax);

  return {
    items,
    summary: {
      itemsCount: items.length,
      totalQuantity,
      subtotal,
      savings,
      shipping,
      tax,
      taxRate: env.order.taxRate,
      total,
      freeShippingThreshold: env.order.freeShippingThreshold,
      amountToFreeShipping: shipping > 0 ? round(env.order.freeShippingThreshold - subtotal) : 0,
    },
  };
};

export const getCartPayload = async (userId) => {
  const { cart, notices } = await loadSanitizedCart(userId);
  return { ...buildCartSummary(cart), notices, updatedAt: cart.updatedAt };
};

export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [] } }, { upsert: true });
};
