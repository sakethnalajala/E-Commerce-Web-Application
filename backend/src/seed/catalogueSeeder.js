/**
 * Shared insertion logic for the extended catalogue. Used by the full seed
 * (`npm run seed`) and by the additive `npm run seed:catalogue`.
 */
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { ROLES } from '../utils/constants.js';
import { categories as categorySeed, reviewTemplates } from './data.js';
import { photoLibrary } from './catalogueLibrary.js';
import { generateCatalogue, assertLibraryCoverage } from './catalogue.js';
import { resolveImages } from './seedDatabase.js';

/**
 * Uploads each library photo once and reuses the resulting Cloudinary URL for
 * every product of that type. Photos already uploaded (same public ID on any
 * product) are reused rather than re-sent.
 */
const buildImageIndex = async () => {
  const index = new Map();
  for (const [key, photos] of Object.entries(photoLibrary)) {
    const publicIds = photos.map((_, i) => `${env.cloudinary.folder}/seed/library/${key}-${i}`);
    // Already uploaded on a previous run? Reuse the stored URLs.
    // eslint-disable-next-line no-await-in-loop
    const owners = await Product.find({ 'images.publicId': { $in: publicIds } }, { images: 1 }).lean();
    const known = new Map(owners.flatMap((doc) => doc.images).map((image) => [image.publicId, image]));
    if (publicIds.every((id) => known.has(id))) {
      index.set(key, publicIds.map((id) => known.get(id)));
      continue;
    }
    try {
      // resolveImages names files `${slug}-${i}` under `${folder}/seed`, matching publicIds above.
      // eslint-disable-next-line no-await-in-loop
      const uploaded = await resolveImages(photos.map((photo) => photo.url), `library/${key}`);
      index.set(key, uploaded);
    } catch (error) {
      logger.warn(`Could not upload photos for "${key}": ${error.message}`);
    }
  }
  return index;
};

/** Atlas occasionally resets idle connections after the long upload phase; retry transient network errors. */
const withRetry = async (operation, attempts = 4) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!/ECONNRESET|MongoNetworkError|MongoServerSelectionError|timed out/i.test(String(error?.message ?? error))) throw error;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw lastError;
};

/**
 * Tops every category up to `target` products. Existing products are counted
 * and never modified; names that already exist are skipped.
 */
export const seedExtendedCatalogue = async ({ target = 90, withReviews = true } = {}) => {
  assertLibraryCoverage();
  /* Categories: create any that are missing. */
  const categoryByName = new Map();
  for (const entry of categorySeed) {
    // eslint-disable-next-line no-await-in-loop
    let category = await Category.findOne({ name: entry.name });
    // eslint-disable-next-line no-await-in-loop
    if (!category) category = await Category.create(entry);
    categoryByName.set(entry.name, category);
  }

  /* Photos */
  logger.info('Preparing photo library on Cloudinary…');
  const imageIndex = await buildImageIndex();
  logger.info(`Photo library ready: ${imageIndex.size} product types.`);

  /* Products */
  const generated = generateCatalogue({ target });
  const reviewers = withReviews ? await User.find({ role: ROLES.CUSTOMER, email: /@example\.com$/ }).limit(6) : [];
  let created = 0;
  let skipped = 0;
  let reviews = 0;
  const createdProducts = [];

  for (const [categoryName, products] of Object.entries(generated)) {
    const category = categoryByName.get(categoryName);
    // eslint-disable-next-line no-await-in-loop
    const existingCount = await Product.countDocuments({ category: category._id });
    const needed = Math.max(0, target - existingCount);
    logger.info(`${categoryName}: ${existingCount} existing, adding up to ${needed}.`);

    let added = 0;
    for (const entry of products) {
      if (added >= needed) break;
      // eslint-disable-next-line no-await-in-loop
      if (await withRetry(() => Product.exists({ name: entry.name }))) {
        skipped += 1;
        continue;
      }
      const library = imageIndex.get(entry.photo) ?? [];
      if (!library.length) {
        logger.warn(`No photos for type "${entry.photo}" — skipped "${entry.name}".`);
        continue;
      }
      // First photo always; a second one on roughly a third of products for gallery variety.
      const images = library.length > 1 && added % 3 === 0 ? library.slice(0, 2) : [library[0]];

      // eslint-disable-next-line no-await-in-loop
      const product = await withRetry(() => Product.create({
        name: entry.name,
        description: entry.description,
        price: entry.price,
        discountPrice: entry.discountPrice,
        category: category._id,
        brand: entry.brand,
        stock: entry.stock,
        isFeatured: entry.isFeatured,
        images,
      }));
      createdProducts.push(product);
      created += 1;
      added += 1;
    }
  }

  /* Reviews: a realistic spread so ratings and counts differ between products. */
  if (reviewers.length && createdProducts.length) {
    for (const [index, product] of createdProducts.entries()) {
      if (index % 5 === 4) continue; // some products have no reviews yet
      const count = 1 + ((index * 7) % 3); // 1–3 reviews
      for (let i = 0; i < count; i += 1) {
        const reviewer = reviewers[(index + i) % reviewers.length];
        const template = reviewTemplates[(index * 3 + i) % reviewTemplates.length];
        try {
          // eslint-disable-next-line no-await-in-loop
          await Review.create({ product: product._id, user: reviewer._id, rating: template.rating, comment: template.comment, isVerifiedPurchase: i === 0 });
          reviews += 1;
        } catch {
          // duplicate (product, user) — ignore
        }
      }
      // Ratings are denormalised on the product (the API does this after every review write).
      // eslint-disable-next-line no-await-in-loop
      await withRetry(() => Review.syncProductRating(product._id));
    }
  }

  logger.info(`Extended catalogue: ${created} products created, ${skipped} already existed, ${reviews} reviews added.`);
  return { created, skipped, reviews, categoryByName };
};
