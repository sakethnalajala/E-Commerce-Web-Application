import { body, param } from 'express-validator';

const passwordRules = (field = 'password', label = 'Password') =>
  body(field)
    .isString()
    .isLength({ min: 8, max: 72 })
    .withMessage(`${label} must be between 8 and 72 characters`)
    .matches(/[a-z]/)
    .withMessage(`${label} must contain a lowercase letter`)
    .matches(/[A-Z]/)
    .withMessage(`${label} must contain an uppercase letter`)
    .matches(/\d/)
    .withMessage(`${label} must contain a number`);

export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 60 })
    .withMessage('Name must be between 2 and 60 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  passwordRules(),
  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^[0-9+\-\s()]{7,20}$/)
    .withMessage('Enter a valid phone number'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Enter a valid email address')
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  param('token')
    .isString()
    .isLength({ min: 20 })
    .withMessage('The reset link is invalid or incomplete'),
  passwordRules('password', 'New password'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  passwordRules('newPassword', 'New password').custom((value, { req }) => {
    if (value === req.body.currentPassword) {
      throw new Error('New password must be different from the current password');
    }
    return true;
  }),
];

export const googleSignInValidation = [
  body('code').optional().isString().isLength({ min: 10, max: 2048 }).withMessage('Invalid Google code'),
  body('credential').optional().isString().isLength({ min: 10, max: 4096 }).withMessage('Invalid Google credential'),
  body().custom((value) => {
    if (!value.code && !value.credential) throw new Error('A Google code or credential is required');
    return true;
  }),
];

export const appleSignInValidation = [
  body('identityToken').isString().isLength({ min: 10, max: 4096 }).withMessage('Invalid Apple identity token'),
  body('user').optional().isObject().withMessage('Invalid Apple user payload'),
  body('user.name.firstName').optional().isString().trim().isLength({ max: 60 }),
  body('user.name.lastName').optional().isString().trim().isLength({ max: 60 }),
];
