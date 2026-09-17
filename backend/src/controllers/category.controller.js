import Category from '../models/Category.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated } from '../utils/ApiResponse.js';
import { uploadImageBuffer, destroyImage } from '../services/cloudinary.service.js';
import { env } from '../config/env.js';

/** GET /categories — public list with live product counts. */
export const getCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === 'admin' && req.query.includeInactive === 'true';
  const filter = includeInactive ? {} : { isActive: true };

  const categories = await Category.find(filter).sort({ name: 1 }).lean();

  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((entry) => [entry._id.toString(), entry.count]));

  const data = categories.map((category) => ({
    ...category,
    productCount: countMap.get(category._id.toString()) ?? 0,
  }));

  return sendSuccess(res, { message: 'Categories loaded.', data: { categories: data } });
});

/** GET /categories/:id */
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).lean();
  if (!category) throw ApiError.notFound('Category not found.');

  const productCount = await Product.countDocuments({ category: category._id });

  return sendSuccess(res, {
    message: 'Category loaded.',
    data: { category: { ...category, productCount } },
  });
});

/** POST /categories (admin) */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, isActive } = req.body;

  const existing = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) throw ApiError.conflict(`A category named "${name}" already exists.`);

  let image = { url: '', publicId: '' };
  if (req.file) {
    image = await uploadImageBuffer(req.file.buffer, { folder: `${env.cloudinary.folder}/categories` });
  }

  try {
    const category = await Category.create({ name, description, isActive, image });
    return sendCreated(res, { message: 'Category created successfully.', data: { category } });
  } catch (error) {
    if (image.publicId) await destroyImage(image.publicId);
    throw error;
  }
});

/** PUT /categories/:id (admin) */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  const { name, description, isActive } = req.body;

  if (name && name.toLowerCase() !== category.name.toLowerCase()) {
    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${name}$`, 'i'),
    });
    if (duplicate) throw ApiError.conflict(`A category named "${name}" already exists.`);
    category.name = name;
  }

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;

  let previousPublicId = null;
  if (req.file) {
    previousPublicId = category.image?.publicId || null;
    category.image = await uploadImageBuffer(req.file.buffer, {
      folder: `${env.cloudinary.folder}/categories`,
    });
  }

  await category.save();
  if (previousPublicId) await destroyImage(previousPublicId);

  return sendSuccess(res, { message: 'Category updated successfully.', data: { category } });
});

/**
 * DELETE /categories/:id (admin)
 * Blocked while products still reference the category, so the catalogue can
 * never end up with dangling category references.
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `"${category.name}" still has ${productCount} product(s). Move or delete them first, or deactivate the category instead.`
    );
  }

  if (category.image?.publicId) await destroyImage(category.image.publicId);
  await category.deleteOne();

  return sendSuccess(res, { message: 'Category deleted successfully.' });
});
