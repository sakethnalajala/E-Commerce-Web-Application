import { body, param, query } from 'express-validator';
import { ROLES } from '../utils/constants.js';

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid phone number'),
];

export const addressValidation = [
  body('label').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('fullName').trim().notEmpty().withMessage('Full name is required').isLength({ max: 60 }),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid phone number'),
  body('addressLine')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
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
  body('isDefault').optional().isBoolean().toBoolean(),
];

export const listUsersValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().trim().isLength({ max: 120 }),
  query('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role filter'),
  query('isActive').optional().isBoolean().toBoolean(),
];

export const updateUserByAdminValidation = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Role must be customer or admin'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false').toBoolean(),
];
