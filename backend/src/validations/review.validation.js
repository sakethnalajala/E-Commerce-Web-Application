import { body, param } from 'express-validator';

export const createReviewValidation = [
  param('productId').isMongoId().withMessage('Invalid product id'),
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
    .toInt(),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Review comment is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters'),
];

export const updateReviewValidation = [
  param('id').isMongoId().withMessage('Invalid review id'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5').toInt(),
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Comment must be between 3 and 1000 characters'),
];
