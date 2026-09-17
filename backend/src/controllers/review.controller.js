import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/ApiResponse.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { ORDER_STATUS, ROLES } from '../utils/constants.js';

/** GET /reviews/product/:productId — public, paginated, with a rating histogram. */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page, limit, skip } = getPagination(req.query);

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) throw ApiError.notFound('Product not found.');

  const [reviews, total, distribution] = await Promise.all([
    Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
    Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]),
  ]);

  const histogram = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: distribution.find((entry) => entry._id === rating)?.count ?? 0,
  }));

  return sendSuccess(res, {
    message: reviews.length ? 'Reviews loaded.' : 'No reviews yet.',
    data: { reviews, histogram },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/**
 * POST /reviews/product/:productId
 * One review per customer per product; purchases are flagged as verified.
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;

  const product = await Product.findById(productId);
  if (!product) throw ApiError.notFound('Product not found.');

  const alreadyReviewed = await Review.findOne({ product: productId, user: req.user._id });
  if (alreadyReviewed) {
    throw ApiError.conflict('You have already reviewed this product. Edit your existing review instead.');
  }

  const purchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    status: { $ne: ORDER_STATUS.CANCELLED },
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    comment,
    isVerifiedPurchase: Boolean(purchased),
  });

  const stats = await Review.syncProductRating(productId);
  await review.populate('user', 'name avatar');

  return sendCreated(res, { message: 'Thanks for your review!', data: { review, stats } });
});

/** PUT /reviews/:id — author only. */
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');

  if (review.user.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('You can only edit your own review.');
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;

  await review.save();
  const stats = await Review.syncProductRating(review.product);
  await review.populate('user', 'name avatar');

  return sendSuccess(res, { message: 'Review updated.', data: { review, stats } });
});

/** DELETE /reviews/:id — author or admin. */
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found.');

  const isAuthor = review.user.toString() === req.user._id.toString();
  if (!isAuthor && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You can only delete your own review.');
  }

  const productId = review.product;
  await review.deleteOne();
  const stats = await Review.syncProductRating(productId);

  return sendSuccess(res, { message: 'Review deleted.', data: { stats } });
});

/** GET /reviews/my — the authenticated customer's reviews. */
export const getMyReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const [reviews, total] = await Promise.all([
    Review.find({ user: req.user._id })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ user: req.user._id }),
  ]);

  return sendSuccess(res, {
    message: reviews.length ? 'Reviews loaded.' : 'You have not written any reviews yet.',
    data: { reviews },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
