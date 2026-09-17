import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import logger from '../utils/logger.js';

const { cloudName, apiKey, apiSecret } = env.cloudinary;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  logger.info(`Cloudinary configured for cloud "${cloudName}"`);
} else {
  logger.warn(
    'Cloudinary credentials are not set. Product image uploads will return a 503 until they are configured.'
  );
}

export default cloudinary;
