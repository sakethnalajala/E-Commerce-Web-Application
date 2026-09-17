import Review from '../models/Review.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { env } from '../config/env.js';
import { isCloudinaryConfigured } from '../services/cloudinary.service.js';
import { isEmailConfigured } from '../services/email.service.js';
import { getDatabaseInfo } from '../config/db.js';
import { LOW_STOCK_THRESHOLD } from '../utils/constants.js';

/**
 * GET /admin/settings
 * Read-only view of the store rules the server enforces. These come from
 * environment variables (see .env.example) — there is deliberately no write
 * endpoint, so pricing can never be changed from a browser session.
 */
export const getStoreSettings = asyncHandler(async (_req, res) => {
  const database = getDatabaseInfo();

  return sendSuccess(res, {
    message: 'Store settings loaded.',
    data: {
      pricing: {
        currency: 'INR',
        freeShippingThreshold: env.order.freeShippingThreshold,
        shippingFee: env.order.shippingFee,
        taxRate: env.order.taxRate,
      },
      inventory: {
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
      checkout: {
        paymentMethods: ['Cash on Delivery'],
        customerCancellableStatuses: ['Pending', 'Confirmed'],
      },
      security: {
        jwtExpiresIn: env.jwt.expiresIn,
        passwordResetMinutes: env.passwordReset.expiresInMinutes,
        rateLimitWindowMinutes: env.rateLimit.windowMinutes,
        rateLimitMax: env.rateLimit.maxRequests,
      },
      integrations: {
        database: { mode: database.mode, name: database.name },
        cloudinary: { configured: isCloudinaryConfigured, folder: env.cloudinary.folder },
        email: { configured: isEmailConfigured },
      },
      environment: env.nodeEnv,
      clientUrl: env.clientUrl,
    },
  });
});

/**
 * GET /admin/reviews
 * Every review across the catalogue, newest first, with product and author.
 * Supports ?productId, ?rating and ?search (product name) plus pagination.
 */
export const getAllReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.productId) filter.product = req.query.productId;

  const rating = Number(req.query.rating);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;

  if (req.query.search) {
    const pattern = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const products = await Product.find({ name: pattern }).select('_id').lean();
    filter.product = { $in: products.map((product) => product._id) };
  }

  const [reviews, total, distribution] = await Promise.all([
    Review.find(filter)
      .populate('product', 'name slug images')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }]),
  ]);

  const histogram = [5, 4, 3, 2, 1].map((value) => ({
    rating: value,
    count: distribution.find((entry) => entry._id === value)?.count ?? 0,
  }));

  return sendSuccess(res, {
    message: reviews.length ? 'Reviews loaded.' : 'No reviews yet.',
    data: { reviews, histogram },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});
