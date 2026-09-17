import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

const assertConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw ApiError.serviceUnavailable(
      'Image uploads are unavailable: Cloudinary credentials are not configured on the server.'
    );
  }
};

/**
 * Streams an in-memory file buffer to Cloudinary. Avoids touching disk, which
 * matters on Render where the filesystem is ephemeral.
 */
export const uploadImageBuffer = (buffer, { folder = env.cloudinary.folder, filename } = {}) => {
  assertConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        public_id: filename,
        overwrite: true,
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          logger.error(`Cloudinary upload failed: ${error.message}`);
          return reject(new ApiError(502, `Image upload failed: ${error.message}`));
        }
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Uploads a batch of multer files. If any upload fails, the ones that already
 * succeeded are removed so no orphaned assets are left behind in Cloudinary.
 */
export const uploadImages = async (files = [], options = {}) => {
  if (!files.length) return [];
  assertConfigured();

  const uploaded = [];
  try {
    for (const file of files) {
      // Sequential upload keeps memory flat and preserves the admin's image order.
      // eslint-disable-next-line no-await-in-loop
      const result = await uploadImageBuffer(file.buffer, options);
      uploaded.push(result);
    }
    return uploaded;
  } catch (error) {
    await destroyImages(uploaded.map((image) => image.publicId));
    throw error;
  }
};

export const destroyImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured) return null;
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    // Deleting an asset must never fail the surrounding request.
    logger.warn(`Cloudinary delete failed for "${publicId}": ${error.message}`);
    return null;
  }
};

export const destroyImages = async (publicIds = []) => {
  const ids = publicIds.filter(Boolean);
  if (!ids.length) return;
  await Promise.all(ids.map((publicId) => destroyImage(publicId)));
};

export { isCloudinaryConfigured };
