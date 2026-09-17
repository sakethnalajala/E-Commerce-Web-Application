/**
 * Operational error carrying an HTTP status code.
 * Anything thrown that is NOT an ApiError is treated as an unexpected bug by the
 * global error handler and its details are hidden from clients in production.
 */
class ApiError extends Error {
  constructor(statusCode, message, { errors = [], code, isOperational = true } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request', errors = []) {
    return new ApiError(400, message, { errors });
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Resource already exists') {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new ApiError(422, message, { errors });
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message);
  }

  static internal(message = 'Something went wrong') {
    return new ApiError(500, message, { isOperational: false });
  }

  static serviceUnavailable(message = 'Service temporarily unavailable') {
    return new ApiError(503, message);
  }
}

export default ApiError;
