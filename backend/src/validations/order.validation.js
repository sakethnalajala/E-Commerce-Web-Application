import { body, param, query } from 'express-validator';
import { ORDER_STATUS_VALUES } from '../utils/constants.js';

/**
 * Checkout only accepts contact + shipping details. Prices, quantities and
 * totals are never read from the request body — the server recomputes them
 * from the persisted cart and product documents.
 */
export const createOrderValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Full name must be between 2 and 60 characters'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid phone number'),
  body('addressLine')
    .trim()
    .notEmpty()
    .withMessage('Shipping address is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters'),
  body('city').trim().notEmpty().withMessage('City is required').isLength({ max: 60 }),
  body('state').trim().notEmpty().withMessage('State is required').isLength({ max: 60 }),
  body('postalCode')
    .trim()
    .notEmpty()
    .withMessage('Postal code is required')
    .matches(/^[A-Za-z0-9\s-]{3,12}$/)
    .withMessage('Enter a valid postal code'),
  body('country').optional({ values: 'falsy' }).trim().isLength({ max: 60 }),
];

export const updateOrderStatusValidation = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(ORDER_STATUS_VALUES)
    .withMessage(`Status must be one of: ${ORDER_STATUS_VALUES.join(', ')}`),
  body('note').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Note is too long'),
];

export const cancelOrderValidation = [
  param('id').isMongoId().withMessage('Invalid order id'),
  body('reason')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 300 })
    .withMessage('Reason cannot exceed 300 characters'),
];

export const listOrdersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status')
    .optional()
    .isIn(ORDER_STATUS_VALUES)
    .withMessage(`Status must be one of: ${ORDER_STATUS_VALUES.join(', ')}`),
  query('search').optional().trim().isLength({ max: 120 }),
  query('from').optional().isISO8601().withMessage('from must be a valid date').toDate(),
  query('to').optional().isISO8601().withMessage('to must be a valid date').toDate(),
];
