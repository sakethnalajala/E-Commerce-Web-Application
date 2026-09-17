import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

/**
 * Runs a list of express-validator chains and converts any failures into a
 * single 422 with a field-keyed error list the frontend can render inline.
 */
export const validate = (validations) => async (req, _res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));

  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path ?? error.param,
    message: error.msg,
  }));

  return next(ApiError.unprocessable('Please correct the highlighted fields.', errors));
};

export default validate;
