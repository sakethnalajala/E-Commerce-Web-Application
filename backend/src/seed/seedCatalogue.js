/**
 * Additive catalogue seed — `npm run seed:catalogue`.
 *
 * Tops every category up to ~90 products using the generator in catalogue.js.
 * Unlike `npm run seed`, nothing is wiped: users, orders, carts, reviews and
 * the existing products stay exactly as they are. Products whose name already
 * exists are skipped, so the script is safe to run more than once. Only the
 * MONGODB_DB_NAME database is touched.
 *
 * Options:
 *   --target=100   products per category (default 90)
 *   --no-reviews   skip generating sample reviews
 */
import mongoose from 'mongoose';
import { assertRequiredEnv } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import logger from '../utils/logger.js';
import Product from '../models/Product.js';
import { seedExtendedCatalogue } from './catalogueSeeder.js';

const arg = (name, fallback) => {
  const match = process.argv.find((value) => value.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : fallback;
};

const run = async () => {
  try {
    assertRequiredEnv();
    if (!isCloudinaryConfigured) throw new Error('Cloudinary is not configured — set CLOUDINARY_* in backend/.env first.');
    await connectDatabase();
    logger.info(`Target database: "${mongoose.connection.name}" — additive only, nothing is deleted.`);

    const { categoryByName } = await seedExtendedCatalogue({
      target: Number(arg('target', 90)),
      withReviews: !process.argv.includes('--no-reviews'),
    });
    for (const [name, category] of categoryByName) {
      // eslint-disable-next-line no-await-in-loop
      logger.info(`  ${name}: ${await Product.countDocuments({ category: category._id })} products`);
    }
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error(`Catalogue seed failed: ${error.message}`);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

run();
