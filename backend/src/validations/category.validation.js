import { body, param } from 'express-validator';

export const createCategoryValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];

export const updateCategoryValidation = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category name must be between 2 and 50 characters'),
  body('description')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];
