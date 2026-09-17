import mongoose from 'mongoose';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';
import { env } from '../config/env.js';

/** 404 handler for unmatched routes. Runs before the error handler. */
export const notFoundHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} does not exist on this API.`));
};

/** Translates framework/driver errors into a consistent ApiError. */
const normalizeError = (error) => {
  if (error instanceof ApiError) return error;

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    return ApiError.unprocessable('Please correct the highlighted fields.', errors);
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value "${error.value}" for field "${error.path}".`);
  }

  // Duplicate key
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'field';
    const value = error.keyValue?.[field];
    return ApiError.conflict(`A record with ${field} "${value}" already exists.`);
  }

  if (error instanceof multer.MulterError) {
    return ApiError.badRequest(`File upload failed: ${error.message}`);
  }

  if (error.name === 'JsonWebTokenError') return ApiError.unauthorized('Invalid authentication token.');
  if (error.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Your session has expired. Please log in again.');
  }

  if (error.type === 'entity.parse.failed') {
    return ApiError.badRequest('Request body is not valid JSON.');
  }

  if (error.http_code || error.name === 'CloudinaryError') {
    return new ApiError(error.http_code === 401 ? 503 : 502, `Image service error: ${error.message}`);
  }

  if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
    return ApiError.serviceUnavailable('Database is temporarily unavailable. Please retry shortly.');
  }

  return new ApiError(error.statusCode || 500, error.message || 'Something went wrong', {
    isOperational: false,
  });
};

/**
 * Centralized error handler. Must be registered last.
 * Unexpected (non-operational) errors are logged with a stack trace and
 * reported to the client with a generic message in production.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, _next) => {
  const apiError = normalizeError(error);
  const { statusCode, isOperational } = apiError;

  if (statusCode >= 500 || !isOperational) {
    logger.error(`${req.method} ${req.originalUrl} -> ${statusCode} ${apiError.message}`);
    if (error.stack) logger.error(error.stack);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${statusCode} ${apiError.message}`);
  }

  const exposeMessage = isOperational || !env.isProduction;

  const body = {
    success: false,
    message: exposeMessage ? apiError.message : 'Something went wrong. Please try again later.',
  };

  if (apiError.errors?.length) body.errors = apiError.errors;
  if (!env.isProduction && error.stack) body.stack = error.stack;

  return res.status(statusCode).json(body);
};

export default errorHandler;
