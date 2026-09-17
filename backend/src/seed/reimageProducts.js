/**
 * Replace product photos in place — `npm run seed:images`.
 *
 * For every seed product still carrying a placeholder (or when run with
 * `--force`), uploads the curated photo from productImages.js to Cloudinary
 * and updates only that product's `images`. Orders, reviews, carts, users and
 * every other field are left exactly as they are, so this is safe to run on a
 * live catalogue. Only the MONGODB_DB_NAME database is ever touched.
 */
import mongoose from 'mongoose';
import { env, assertRequiredEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { destroyImages } from '../services/cloudinary.service.js';
import logger from '../utils/logger.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { productImages } from './productImages.js';
import { resolveImages } from './seedDatabase.js';

const isPlaceholder = (image) =>
  !image?.url || /picsum\.photos|placeholder|placehold\./i.test(image.url) || /^seed-local\//.test(image.publicId ?? '');

const run = async () => {
  try {
    assertRequiredEnv();
    if (!isCloudinaryConfigured) {
      throw new Error('Cloudinary is not configured — set CLOUDINARY_* in backend/.env first.');
    }
    await connectDatabase();
    logger.info(`Target database: "${mongoose.connection.name}" (products collection only).`);

    const force = process.argv.includes('--force');
    let updated = 0;
    let skipped = 0;

    for (const [name, entries] of Object.entries(productImages)) {
      // eslint-disable-next-line no-await-in-loop
      const product = await Product.findOne({ name });
      if (!product) {
        logger.warn(`No product named "${name}" — skipped.`);
        continue;
      }
      const needsImages = force || product.images.length === 0 || product.images.some(isPlaceholder);
      if (!needsImages) {
        skipped += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const images = await resolveImages(entries.map((entry) => entry.url), product.slug);
      const previousIds = product.images.filter((image) => !isPlaceholder(image)).map((image) => image.publicId);

      product.images = images;
      // eslint-disable-next-line no-await-in-loop
      await product.save({ validateBeforeSave: false });
      updated += 1;
      logger.info(`Updated "${name}" with ${images.length} image(s).`);

      // Old Cloudinary assets are removed only after the new ones are saved —
      // and never when the new upload reused the same public ID (overwrite).
      const reused = new Set(images.map((image) => image.publicId));
      const previous = previousIds.filter((publicId) => !reused.has(publicId));
      // eslint-disable-next-line no-await-in-loop
      if (previous.length) await destroyImages(previous);

      // Order lines snapshot the image at purchase time; refresh the ones that
      // were pointing at a placeholder so order history shows the real product.
      // eslint-disable-next-line no-await-in-loop
      const orders = await Order.updateMany(
        { 'items.product': product._id, 'items.image': /picsum\.photos|placeholder/i },
        { $set: { 'items.$[line].image': images[0].url } },
        { arrayFilters: [{ 'line.product': product._id, 'line.image': /picsum\.photos|placeholder/i }] }
      );
      if (orders.modifiedCount) logger.info(`  ↳ refreshed the image on ${orders.modifiedCount} order(s).`);
    }

    logger.info(`Done: ${updated} product(s) updated, ${skipped} already had real images.`);
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error(`Re-image failed: ${error.message}`);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

run();
