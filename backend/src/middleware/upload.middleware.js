import multer from 'multer';
import ApiError from '../utils/ApiError.js';
import { MAX_PRODUCT_IMAGES } from '../utils/constants.js';

const MAX_FILE_SIZE_MB = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Files are buffered in memory and streamed straight to Cloudinary — nothing is
 * written to the Render filesystem, which is ephemeral.
 */
const storage = multer.memoryStorage();

const fileFilter = (_req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      ApiError.badRequest(
        `Unsupported image type "${file.mimetype}". Allowed: JPEG, PNG, WebP, AVIF.`
      )
    );
  }
  return callback(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: MAX_PRODUCT_IMAGES,
  },
});

/** Accepts up to MAX_PRODUCT_IMAGES files under the `images` field. */
export const uploadProductImages = (req, res, next) =>
  upload.array('images', MAX_PRODUCT_IMAGES)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest(`Each image must be smaller than ${MAX_FILE_SIZE_MB}MB.`));
      }
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(
          ApiError.badRequest(
            `Upload a maximum of ${MAX_PRODUCT_IMAGES} images using the "images" field.`
          )
        );
      }
      return next(ApiError.badRequest(`Image upload failed: ${error.message}`));
    }

    return next(error);
  });

/** Accepts a single file under the `image` field (categories, avatars). */
export const uploadSingleImage = (fieldName = 'image') => (req, res, next) =>
  upload.single(fieldName)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest(`The image must be smaller than ${MAX_FILE_SIZE_MB}MB.`));
      }
      return next(ApiError.badRequest(`Image upload failed: ${error.message}`));
    }

    return next(error);
  });

export default upload;
