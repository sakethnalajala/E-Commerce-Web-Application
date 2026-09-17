import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadSingleImage } from '../middleware/upload.middleware.js';
import {
  createCategoryValidation,
  updateCategoryValidation,
} from '../validations/category.validation.js';
import { objectIdParam } from '../validations/product.validation.js';

const router = Router();

router.get('/', optionalAuth, getCategories);
router.get('/:id', validate(objectIdParam('id', 'category id')), getCategoryById);

router.post(
  '/',
  protect,
  adminOnly,
  uploadSingleImage('image'),
  validate(createCategoryValidation),
  createCategory
);
router.put(
  '/:id',
  protect,
  adminOnly,
  uploadSingleImage('image'),
  validate(updateCategoryValidation),
  updateCategory
);
router.delete('/:id', protect, adminOnly, validate(objectIdParam('id', 'category id')), deleteCategory);

export default router;
