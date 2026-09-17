import mongoose from 'mongoose';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { uploadImageBuffer, destroyImage } from '../services/cloudinary.service.js';
import { env } from '../config/env.js';
import { ROLES, ORDER_STATUS } from '../utils/constants.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------------------------------------------ */
/* Customer — own profile                                              */
/* ------------------------------------------------------------------ */

/** GET /users/profile */
export const getProfile = asyncHandler(async (req, res) => {
  const [orderStats, reviewCount] = await Promise.all([
    Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: { $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$totalPrice', 0] },
          },
        },
      },
    ]),
    Review.countDocuments({ user: req.user._id }),
  ]);

  return sendSuccess(res, {
    message: 'Profile loaded.',
    data: {
      user: req.user.toJSON(),
      stats: {
        totalOrders: orderStats[0]?.totalOrders ?? 0,
        totalSpent: Math.round((orderStats[0]?.totalSpent ?? 0) * 100) / 100,
        totalReviews: reviewCount,
      },
    },
  });
});

/** PUT /users/profile — name, phone and avatar only. Email and role are fixed. */
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found.');

  if (req.body.name !== undefined) user.name = req.body.name;
  if (req.body.phone !== undefined) user.phone = req.body.phone;

  let previousAvatarId = null;
  if (req.file) {
    previousAvatarId = user.avatar?.publicId || null;
    user.avatar = await uploadImageBuffer(req.file.buffer, {
      folder: `${env.cloudinary.folder}/avatars`,
    });
  }

  await user.save();
  if (previousAvatarId) await destroyImage(previousAvatarId);

  return sendSuccess(res, { message: 'Profile updated.', data: { user: user.toJSON() } });
});

/* ------------------------------------------------------------------ */
/* Customer — saved addresses                                          */
/* ------------------------------------------------------------------ */

/** GET /users/addresses */
export const getAddresses = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Addresses loaded.', data: { addresses: req.user.addresses } })
);

/** POST /users/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  const isFirst = user.addresses.length === 0;
  const shouldBeDefault = isFirst || req.body.isDefault === true;

  if (shouldBeDefault) user.addresses.forEach((address) => { address.isDefault = false; });

  user.addresses.push({ ...req.body, isDefault: shouldBeDefault });
  await user.save();

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Address saved.',
    data: { addresses: user.addresses },
  });
});

/** PUT /users/addresses/:addressId */
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found.');

  Object.assign(address, req.body);

  if (req.body.isDefault === true) {
    user.addresses.forEach((entry) => {
      entry.isDefault = entry._id.toString() === address._id.toString();
    });
  }

  await user.save();

  return sendSuccess(res, { message: 'Address updated.', data: { addresses: user.addresses } });
});

/** DELETE /users/addresses/:addressId */
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw ApiError.notFound('Address not found.');

  const wasDefault = address.isDefault;
  address.deleteOne();

  // Promote another address so the customer always has a default.
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;

  await user.save();

  return sendSuccess(res, { message: 'Address removed.', data: { addresses: user.addresses } });
});

/* ------------------------------------------------------------------ */
/* Admin — user management                                             */
/* ------------------------------------------------------------------ */

/** GET /users (admin) — password fields are never selected. */
export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive;

  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search.trim()), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach order totals so the admin list is useful at a glance.
  const userIds = users.map((user) => user._id);
  const orderStats = await Order.aggregate([
    { $match: { user: { $in: userIds } } },
    {
      $group: {
        _id: '$user',
        totalOrders: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$totalPrice', 0] },
        },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ]);

  const statsMap = new Map(orderStats.map((entry) => [entry._id.toString(), entry]));

  const data = users.map(({ password, resetPasswordToken, resetPasswordExpires, __v, ...user }) => ({
    ...user,
    totalOrders: statsMap.get(user._id.toString())?.totalOrders ?? 0,
    totalSpent: Math.round((statsMap.get(user._id.toString())?.totalSpent ?? 0) * 100) / 100,
    lastOrderAt: statsMap.get(user._id.toString())?.lastOrderAt ?? null,
  }));

  return sendSuccess(res, {
    message: 'Users loaded.',
    data: { users: data },
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

/** GET /users/:id (admin) — profile plus order summary and recent orders. */
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  const [stats, recentOrders, reviewCount] = await Promise.all([
    Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: { $cond: [{ $ne: ['$status', ORDER_STATUS.CANCELLED] }, '$totalPrice', 0] },
          },
        },
      },
    ]),
    Order.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber status totalPrice totalQuantity createdAt')
      .lean(),
    Review.countDocuments({ user: req.params.id }),
  ]);

  return sendSuccess(res, {
    message: 'User loaded.',
    data: {
      user: user.toJSON(),
      stats: {
        totalOrders: stats[0]?.totalOrders ?? 0,
        totalSpent: Math.round((stats[0]?.totalSpent ?? 0) * 100) / 100,
        totalReviews: reviewCount,
      },
      recentOrders,
    },
  });
});

/**
 * PATCH /users/:id (admin)
 * Guards against an admin locking themselves out of their own account.
 */
export const updateUserByAdmin = asyncHandler(async (req, res) => {
  const { role, isActive } = req.body;

  if (req.params.id === req.user._id.toString()) {
    if (role && role !== req.user.role) {
      throw ApiError.badRequest('You cannot change your own role.');
    }
    if (isActive === false) {
      throw ApiError.badRequest('You cannot deactivate your own account.');
    }
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  // Never remove the last remaining admin.
  if (user.role === ROLES.ADMIN && role === ROLES.CUSTOMER) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) throw ApiError.badRequest('At least one admin account must remain.');
  }

  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  return sendSuccess(res, { message: 'User updated.', data: { user: user.toJSON() } });
});

/** DELETE /users/:id (admin) — refuses when the customer has order history. */
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (user.role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount <= 1) throw ApiError.badRequest('At least one admin account must remain.');
  }

  const orderCount = await Order.countDocuments({ user: user._id });
  if (orderCount > 0) {
    throw ApiError.conflict(
      `This customer has ${orderCount} order(s) on record. Deactivate the account instead of deleting it.`
    );
  }

  if (user.avatar?.publicId) await destroyImage(user.avatar.publicId);
  await mongoose.model('Cart').deleteOne({ user: user._id });
  await Review.deleteMany({ user: user._id });
  await user.deleteOne();

  return sendSuccess(res, { message: 'User deleted.' });
});
