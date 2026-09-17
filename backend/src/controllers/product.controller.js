import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/ApiResponse.js';
import { uploadImages, destroyImages } from '../services/cloudinary.service.js';
import {
  listProducts,
  findProductByIdentifier,
  listBrands,
  getPriceRange,
  getRelatedProducts,
} from '../services/product.service.js';
import { MAX_PRODUCT_IMAGES, ORDER_STATUS } from '../utils/constants.js';

/** GET /products — public catalogue with search, filters, sorting, pagination. */
export const getProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await listProducts(req.query);

  return sendSuccess(res, {
    message: items.length ? 'Products loaded.' : 'No products matched your filters.',
    data: { products: items },
    meta,
  });
});

/** GET /products/filters — options that drive the filter sidebar. */
export const getProductFilters = asyncHandler(async (req, res) => {
  // With ?category=<slug|id[,…]> the brand list and price range are scoped to
  // that category, so the sidebar only offers options that can match.
  const scope = { category: typeof req.query.category === 'string' ? req.query.category : undefined };
  const [categories, brands, priceRange] = await Promise.all([
    Category.find({ isActive: true }).select('name slug').sort({ name: 1 }).lean(),
    listBrands(scope),
    getPriceRange(scope),
  ]);

  return sendSuccess(res, {
    message: 'Filter options loaded.',
    data: { categories, brands, priceRange },
  });
});

/** GET /products/featured */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 24);

  const products = await Product.find({ isActive: true, isFeatured: true, stock: { $gt: 0 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .lean({ virtuals: true });

  return sendSuccess(res, { message: 'Featured products loaded.', data: { products } });
});

/** GET /products/:identifier — by id or slug, with reviews and related items. */
export const getProductByIdentifier = asyncHandler(async (req, res) => {
  const product = await findProductByIdentifier(req.params.identifier);

  const [reviews, related] = await Promise.all([
    Review.find({ product: product._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    getRelatedProducts(product),
  ]);

  // Personalization for a logged-in viewer: can they review, and have they already?
  let viewer = null;
  if (req.user) {
    const [existingReview, purchased] = await Promise.all([
      Review.findOne({ product: product._id, user: req.user._id }).lean(),
      Order.exists({
        user: req.user._id,
        'items.product': product._id,
        status: { $ne: ORDER_STATUS.CANCELLED },
      }),
    ]);

    viewer = {
      hasReviewed: Boolean(existingReview),
      reviewId: existingReview?._id ?? null,
      hasPurchased: Boolean(purchased),
    };
  }

  return sendSuccess(res, {
    message: 'Product loaded.',
    data: { product: product.toJSON(), reviews, related, viewer },
  });
});

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

/** GET /products/admin/all — includes inactive products. */
export const getProductsForAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await listProducts(req.query, { includeInactive: true });

  return sendSuccess(res, { message: 'Products loaded.', data: { products: items }, meta });
});

/** POST /products — multipart/form-data with up to 6 images. */
export const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, discountPrice, category, brand, stock, isFeatured } = req.body;

  const categoryExists = await Category.findById(category);
  if (!categoryExists) throw ApiError.badRequest('The selected category does not exist.');

  if (!req.files?.length) {
    throw ApiError.badRequest('At least one product image is required.');
  }

  const images = await uploadImages(req.files);

  try {
    const product = await Product.create({
      name,
      description,
      price,
      discountPrice: discountPrice || null,
      category,
      brand,
      stock,
      isFeatured: isFeatured ?? false,
      images,
    });

    await product.populate('category', 'name slug');

    return sendCreated(res, { message: 'Product created successfully.', data: { product } });
  } catch (error) {
    // Do not leave uploaded assets orphaned in Cloudinary.
    await destroyImages(images.map((image) => image.publicId));
    throw error;
  }
});

/** PUT /products/:id — partial update, optional new images, optional removals. */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  const { category, removeImages, ...rest } = req.body;

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) throw ApiError.badRequest('The selected category does not exist.');
    product.category = category;
  }

  const updatableFields = [
    'name',
    'description',
    'price',
    'discountPrice',
    'brand',
    'stock',
    'isActive',
    'isFeatured',
  ];

  updatableFields.forEach((field) => {
    if (rest[field] !== undefined && rest[field] !== '') product[field] = rest[field];
  });

  // Explicitly clearing the discount.
  if (rest.discountPrice === '' || rest.discountPrice === null) product.discountPrice = null;

  const publicIdsToRemove = (Array.isArray(removeImages) ? removeImages : [removeImages])
    .filter(Boolean)
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  let remainingImages = product.images;
  if (publicIdsToRemove.length) {
    remainingImages = product.images.filter((image) => !publicIdsToRemove.includes(image.publicId));
  }

  const uploaded = req.files?.length ? await uploadImages(req.files) : [];
  const nextImages = [...remainingImages, ...uploaded];

  if (!nextImages.length) {
    await destroyImages(uploaded.map((image) => image.publicId));
    throw ApiError.badRequest('A product must keep at least one image.');
  }

  if (nextImages.length > MAX_PRODUCT_IMAGES) {
    await destroyImages(uploaded.map((image) => image.publicId));
    throw ApiError.badRequest(`A product cannot have more than ${MAX_PRODUCT_IMAGES} images.`);
  }

  product.images = nextImages;

  try {
    await product.save();
  } catch (error) {
    await destroyImages(uploaded.map((image) => image.publicId));
    throw error;
  }

  // Only drop the old assets once the document saved successfully.
  if (publicIdsToRemove.length) await destroyImages(publicIdsToRemove);

  await product.populate('category', 'name slug');

  return sendSuccess(res, { message: 'Product updated successfully.', data: { product } });
});

/**
 * DELETE /products/:id
 * A product referenced by existing orders is deactivated instead of deleted so
 * order history keeps resolving. Use ?force=true to delete regardless.
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  const referencedByOrder = await Order.exists({ 'items.product': product._id });

  if (referencedByOrder && req.query.force !== 'true') {
    product.isActive = false;
    await product.save();

    return sendSuccess(res, {
      message:
        'This product appears in existing orders, so it was archived (hidden from the store) instead of deleted.',
      data: { product, archived: true },
    });
  }

  await destroyImages(product.images.map((image) => image.publicId));
  await Review.deleteMany({ product: product._id });
  await mongoose.model('Cart').updateMany({}, { $pull: { items: { product: product._id } } });
  await product.deleteOne();

  return sendSuccess(res, { message: 'Product deleted successfully.', data: { archived: false } });
});

/** PATCH /products/:id/stock — quick inventory adjustment from the admin table. */
export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const parsed = Number(stock);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw ApiError.badRequest('Stock must be a whole number of 0 or more.');
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { stock: parsed },
    { new: true, runValidators: true }
  ).populate('category', 'name slug');

  if (!product) throw ApiError.notFound('Product not found.');

  return sendSuccess(res, { message: 'Stock updated.', data: { product } });
});
