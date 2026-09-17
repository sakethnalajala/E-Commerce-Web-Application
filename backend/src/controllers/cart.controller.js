import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getOrCreateCart, getCartPayload } from '../services/cart.service.js';

/** GET /cart */
export const getCart = asyncHandler(async (req, res) => {
  const payload = await getCartPayload(req.user._id);

  return sendSuccess(res, {
    message: payload.items.length ? 'Cart loaded.' : 'Your cart is empty.',
    data: payload,
  });
});

/**
 * POST /cart
 * Quantity is validated against live stock, including whatever is already in
 * the cart, so the total reserved amount can never exceed availability.
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw ApiError.notFound('This product is no longer available.');
  if (product.stock <= 0) throw ApiError.conflict(`"${product.name}" is currently out of stock.`);

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.findItem(productId);
  const requestedQuantity = (existingItem?.quantity ?? 0) + Number(quantity);

  if (requestedQuantity > product.stock) {
    throw ApiError.conflict(
      `Only ${product.stock} unit(s) of "${product.name}" are available` +
        (existingItem ? ` and you already have ${existingItem.quantity} in your cart.` : '.')
    );
  }

  if (existingItem) existingItem.quantity = requestedQuantity;
  else cart.items.push({ product: productId, quantity: Number(quantity) });

  await cart.save();

  const payload = await getCartPayload(req.user._id);

  return sendSuccess(res, { message: `"${product.name}" added to your cart.`, data: payload });
});

/** PUT /cart/:productId — set an absolute quantity (0 removes the item). */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const quantity = Number(req.body.quantity);

  const cart = await getOrCreateCart(req.user._id);
  const item = cart.findItem(productId);
  if (!item) throw ApiError.notFound('That product is not in your cart.');

  if (quantity === 0) {
    cart.items = cart.items.filter((cartItem) => cartItem.product.toString() !== productId);
    await cart.save();

    return sendSuccess(res, {
      message: 'Item removed from your cart.',
      data: await getCartPayload(req.user._id),
    });
  }

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw ApiError.notFound('This product is no longer available.');
  if (quantity > product.stock) {
    throw ApiError.conflict(`Only ${product.stock} unit(s) of "${product.name}" are available.`);
  }

  item.quantity = quantity;
  await cart.save();

  return sendSuccess(res, {
    message: 'Cart updated.',
    data: await getCartPayload(req.user._id),
  });
});

/** DELETE /cart/:productId */
export const removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await getOrCreateCart(req.user._id);
  const exists = cart.findItem(productId);
  if (!exists) throw ApiError.notFound('That product is not in your cart.');

  cart.items = cart.items.filter((item) => item.product.toString() !== productId);
  await cart.save();

  return sendSuccess(res, {
    message: 'Item removed from your cart.',
    data: await getCartPayload(req.user._id),
  });
});

/** DELETE /cart */
export const clearCartItems = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();

  return sendSuccess(res, {
    message: 'Cart cleared.',
    data: await getCartPayload(req.user._id),
  });
});

/**
 * POST /cart/merge
 * Folds a guest cart (kept in browser storage) into the user's server cart on
 * login, clamping each line to the available stock.
 */
export const mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items : [];
  if (!incoming.length) {
    return sendSuccess(res, { message: 'Nothing to merge.', data: await getCartPayload(req.user._id) });
  }

  const cart = await getOrCreateCart(req.user._id);
  const skipped = [];

  for (const entry of incoming) {
    const productId = entry?.productId;
    const quantity = Number(entry?.quantity) || 1;
    if (!productId) continue;

    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(productId).select('name stock isActive');
    if (!product || !product.isActive || product.stock <= 0) {
      skipped.push(entry?.name ?? 'An item');
      continue;
    }

    const existing = cart.findItem(productId);
    const merged = Math.min(product.stock, (existing?.quantity ?? 0) + quantity);

    if (existing) existing.quantity = merged;
    else cart.items.push({ product: productId, quantity: merged });
  }

  await cart.save();

  const payload = await getCartPayload(req.user._id);

  return sendSuccess(res, {
    message: skipped.length
      ? `Cart merged. ${skipped.length} unavailable item(s) were skipped.`
      : 'Cart merged.',
    data: payload,
  });
});
