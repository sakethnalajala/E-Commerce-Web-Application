import { body, param, query } from 'express-validator';
import { SORT_OPTIONS } from '../utils/constants.js';

export const objectIdParam = (name = 'id', label = 'identifier') => [
  param(name).isMongoId().withMessage(`Invalid ${label}`),
];

export const listProductsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive number').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Search term is too long'),
  query('category').optional().trim(),
  query('brand').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Minimum price must be 0 or more').toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Maximum price must be 0 or more').toFloat(),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating filter must be 0-5').toFloat(),
  query('inStock').optional().isBoolean().withMessage('inStock must be true or false').toBoolean(),
  query('sort')
    .optional()
    .isIn(Object.keys(SORT_OPTIONS))
    .withMessage(`Sort must be one of: ${Object.keys(SORT_OPTIONS).join(', ')}`),
];

const priceConsistency = body('discountPrice').custom((value, { req }) => {
  if (value === undefined || value === null || value === '') return true;
  const price = Number(req.body.price);
  if (Number.isFinite(price) && Number(value) >= price) {
    throw new Error('Discount price must be lower than the original price');
  }
  return true;
});

export const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 140 })
    .withMessage('Product name must be between 3 and 140 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number')
    .toFloat(),
  body('discountPrice')
    .optional({ values: 'falsy' })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .toFloat(),
  priceConsistency,
  body('category').notEmpty().withMessage('Category is required').isMongoId().withMessage('Invalid category'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 60 })
    .withMessage('Brand cannot exceed 60 characters'),
  body('stock')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be 0 or more')
    .toInt(),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be true or false').toBoolean(),
];

export const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid product id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 140 })
    .withMessage('Product name must be between 3 and 140 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number').toFloat(),
  body('discountPrice')
    .optional({ values: 'null' })
    .isFloat({ min: 0 })
    .withMessage('Discount price must be a positive number')
    .toFloat(),
  body('category').optional().isMongoId().withMessage('Invalid category'),
  body('brand').optional().trim().isLength({ max: 60 }).withMessage('Brand cannot exceed 60 characters'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more').toInt(),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be true or false').toBoolean(),
  body('removeImages')
    .optional()
    .custom((value) => {
      if (typeof value === 'string' || Array.isArray(value)) return true;
      throw new Error('removeImages must be an array of Cloudinary public IDs');
    }),
];
