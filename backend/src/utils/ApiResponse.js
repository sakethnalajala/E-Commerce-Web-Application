/**
 * Single success-envelope used by every endpoint, so the frontend can rely on
 * one predictable shape: { success, message, data, meta }.
 */
export const sendSuccess = (res, { statusCode = 200, message = 'Success', data = null, meta } = {}) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

export const sendCreated = (res, { message = 'Created successfully', data = null } = {}) =>
  sendSuccess(res, { statusCode: 201, message, data });

export default sendSuccess;
