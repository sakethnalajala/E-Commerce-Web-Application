/**
 * Client-side validation mirroring the server rules, so users get instant
 * feedback. The API re-validates everything — this is never the only check.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;
const POSTAL_PATTERN = /^[A-Za-z0-9\s-]{3,12}$/;

export const required = (value, label = 'This field') =>
  value === undefined || value === null || String(value).trim() === ''
    ? `${label} is required`
    : null;

export const validateEmail = (value) => {
  if (!value?.trim()) return 'Email is required';
  if (!EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (value, label = 'Password') => {
  if (!value) return `${label} is required`;
  if (value.length < 8) return `${label} must be at least 8 characters`;
  if (!/[a-z]/.test(value)) return `${label} must contain a lowercase letter`;
  if (!/[A-Z]/.test(value)) return `${label} must contain an uppercase letter`;
  if (!/\d/.test(value)) return `${label} must contain a number`;
  return null;
};

export const validateName = (value) => {
  if (!value?.trim()) return 'Name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  if (value.trim().length > 60) return 'Name cannot exceed 60 characters';
  return null;
};

export const validatePhone = (value, { optional = false } = {}) => {
  if (!value?.trim()) return optional ? null : 'Phone number is required';
  if (!PHONE_PATTERN.test(value.trim())) return 'Enter a valid phone number';
  return null;
};

export const validatePostalCode = (value) => {
  if (!value?.trim()) return 'Postal code is required';
  if (!POSTAL_PATTERN.test(value.trim())) return 'Enter a valid postal code';
  return null;
};

export const validateAddressLine = (value) => {
  if (!value?.trim()) return 'Shipping address is required';
  if (value.trim().length < 5) return 'Address must be at least 5 characters';
  if (value.trim().length > 200) return 'Address cannot exceed 200 characters';
  return null;
};

/** Runs a `{ field: validatorFn }` map and returns only the failing fields. */
export const runValidators = (values, validators) =>
  Object.entries(validators).reduce((errors, [field, validator]) => {
    const message = validator(values[field], values);
    return message ? { ...errors, [field]: message } : errors;
  }, {});

export const registerValidators = {
  name: (value) => validateName(value),
  email: (value) => validateEmail(value),
  password: (value) => validatePassword(value),
  confirmPassword: (value, values) =>
    !value ? 'Confirm your password' : value !== values.password ? 'Passwords do not match' : null,
  phone: (value) => validatePhone(value, { optional: true }),
};

export const loginValidators = {
  email: (value) => validateEmail(value),
  password: (value) => (value ? null : 'Password is required'),
};

export const checkoutValidators = {
  fullName: (value) => validateName(value),
  phone: (value) => validatePhone(value),
  addressLine: (value) => validateAddressLine(value),
  city: (value) => required(value, 'City'),
  state: (value) => required(value, 'State'),
  postalCode: (value) => validatePostalCode(value),
};

export const productValidators = {
  name: (value) => {
    if (!value?.trim()) return 'Product name is required';
    if (value.trim().length < 3) return 'Product name must be at least 3 characters';
    if (value.trim().length > 140) return 'Product name cannot exceed 140 characters';
    return null;
  },
  description: (value) => {
    if (!value?.trim()) return 'Description is required';
    if (value.trim().length < 10) return 'Description must be at least 10 characters';
    return null;
  },
  price: (value) => {
    if (value === '' || value === undefined || value === null) return 'Price is required';
    if (Number.isNaN(Number(value)) || Number(value) < 0) return 'Price must be a positive number';
    return null;
  },
  discountPrice: (value, values) => {
    if (value === '' || value === undefined || value === null) return null;
    if (Number.isNaN(Number(value)) || Number(value) < 0) return 'Discount must be a positive number';
    if (Number(value) >= Number(values.price)) return 'Discount must be lower than the original price';
    return null;
  },
  category: (value) => required(value, 'Category'),
  brand: (value) => required(value, 'Brand'),
  stock: (value) => {
    if (value === '' || value === undefined || value === null) return 'Stock is required';
    if (!Number.isInteger(Number(value)) || Number(value) < 0) return 'Stock must be a whole number';
    return null;
  },
};

export const categoryValidators = {
  name: (value) => {
    if (!value?.trim()) return 'Category name is required';
    if (value.trim().length < 2) return 'Category name must be at least 2 characters';
    if (value.trim().length > 50) return 'Category name cannot exceed 50 characters';
    return null;
  },
  description: (value) =>
    value && value.length > 500 ? 'Description cannot exceed 500 characters' : null,
};

export const reviewValidators = {
  rating: (value) => (Number(value) >= 1 && Number(value) <= 5 ? null : 'Select a rating'),
  comment: (value) => {
    if (!value?.trim()) return 'Please write a short review';
    if (value.trim().length < 3) return 'Review must be at least 3 characters';
    if (value.trim().length > 1000) return 'Review cannot exceed 1000 characters';
    return null;
  },
};
