import { body, param } from 'express-validator';

export const addToCartValidation = [
  body('productId').notEmpty().withMessage('Product is required').isMongoId().withMessage('Invalid product id'),
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Quantity must be between 1 and 100')
    .toInt(),
];

export const updateCartItemValidation = [
  param('productId').isMongoId().withMessage('Invalid product id'),
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0, max: 100 })
    .withMessage('Quantity must be between 0 and 100')
    .toInt(),
];

export const cartItemParamValidation = [param('productId').isMongoId().withMessage('Invalid product id')];
