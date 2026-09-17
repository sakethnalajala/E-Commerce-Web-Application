/**
 * Seeding routines shared by the CLI (`npm run seed`) and by the in-memory
 * development bootstrap. Writes a working catalogue, customers, orders and
 * reviews straight into MongoDB, so every screen and every analytics figure is
 * reading real database records.
 *
 * Admin credentials come from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.
 */
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadImageBuffer } from '../services/cloudinary.service.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import { ORDER_STATUS, ROLES } from '../utils/constants.js';
import { categories as categorySeed, products as productSeed, reviewTemplates } from './data.js';

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@shopsphere.dev';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD || 'Customer@12345';
/** Products per category after seeding (the curated 24 count toward it). */
const EXTENDED_CATALOGUE_TARGET = Number(process.env.SEED_PRODUCTS_PER_CATEGORY || 90);

const customerSeed = [
  { name: 'Aarav Sharma', email: 'aarav@example.com', phone: '9876543210' },
  { name: 'Diya Patel', email: 'diya@example.com', phone: '9876543211' },
  { name: 'Rohan Mehta', email: 'rohan@example.com', phone: '9876543212' },
  { name: 'Sara Khan', email: 'sara@example.com', phone: '9876543213' },
  { name: 'Vikram Iyer', email: 'vikram@example.com', phone: '9876543214' },
];

/**
 * With Cloudinary configured the seed images are uploaded for real, so the
 * catalogue exercises the same storage path as an admin upload. Without it the
 * source URL is stored directly and flagged so nothing tries to delete it.
 */
export const resolveImages = async (urls, slug) => {
  if (!isCloudinaryConfigured) {
    return urls.map((url, index) => ({ url, publicId: `seed-local/${slug}-${index}` }));
  }

  const uploaded = [];
  for (const [index, url] of urls.entries()) {
    // Download here and stream the bytes up: some image hosts refuse
    // Cloudinary's server-side fetch, and this also validates the URL first.
    // eslint-disable-next-line no-await-in-loop
    const buffer = await downloadImage(url);
    // eslint-disable-next-line no-await-in-loop
    const result = await uploadImageBuffer(buffer, {
      folder: `${env.cloudinary.folder}/seed`,
      filename: `${slug}-${index}`,
    });
    uploaded.push(result);
  }
  return uploaded;
};

const downloadImage = async (url, attempts = 3) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'ShopSphere-seed/1.0' } });
      if (!response.ok) throw new Error(`Could not download ${url}: HTTP ${response.status}`);
      const type = response.headers.get('content-type') ?? '';
      if (!type.startsWith('image/')) throw new Error(`Not an image (${type}): ${url}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      // Image hosts occasionally drop connections; back off briefly and retry.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
  throw lastError;
};

export const wipeDatabase = async () => {
  await Promise.all([
    Order.deleteMany({}),
    Review.deleteMany({}),
    Cart.deleteMany({}),
    Product.deleteMany({}),
    Category.deleteMany({}),
    User.deleteMany({}),
  ]);
  logger.info('Existing collections cleared.');
};

export const seedDatabase = async () => {
  await wipeDatabase();

  /* Users -------------------------------------------------------------- */
  const admin = await User.create({
    name: 'Store Admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    role: ROLES.ADMIN,
    phone: '9000000000',
  });

  const customers = await User.create(
    customerSeed.map((customer) => ({
      ...customer,
      password: CUSTOMER_PASSWORD,
      role: ROLES.CUSTOMER,
      addresses: [
        {
          label: 'Home',
          fullName: customer.name,
          phone: customer.phone,
          addressLine: '221B Residency Road, Sector 14',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
          isDefault: true,
        },
      ],
    }))
  );
  logger.info(`Created ${customers.length + 1} users.`);

  /* Categories --------------------------------------------------------- */
  const createdCategories = await Category.create(categorySeed);
  const categoryByName = new Map(createdCategories.map((category) => [category.name, category]));
  logger.info(`Created ${createdCategories.length} categories.`);

  /* Products ----------------------------------------------------------- */
  const createdProducts = [];
  for (const entry of productSeed) {
    const category = categoryByName.get(entry.category);
    const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // eslint-disable-next-line no-await-in-loop
    const images = await resolveImages(entry.images, slug);

    // eslint-disable-next-line no-await-in-loop
    const product = await Product.create({
      name: entry.name,
      description: entry.description,
      price: entry.price,
      discountPrice: entry.discountPrice ?? null,
      category: category._id,
      brand: entry.brand,
      stock: entry.stock,
      isFeatured: entry.isFeatured ?? false,
      images,
    });

    createdProducts.push(product);
  }
  logger.info(`Created ${createdProducts.length} products.`);

  /* Reviews ------------------------------------------------------------ */
  let reviewCount = 0;
  for (const [index, product] of createdProducts.entries()) {
    const reviewers = customers.slice(0, (index % 4) + 1);

    for (const [reviewerIndex, reviewer] of reviewers.entries()) {
      const template = reviewTemplates[(index + reviewerIndex) % reviewTemplates.length];
      // eslint-disable-next-line no-await-in-loop
      await Review.create({
        product: product._id,
        user: reviewer._id,
        rating: template.rating,
        comment: template.comment,
        isVerifiedPurchase: reviewerIndex % 2 === 0,
      });
      reviewCount += 1;
    }

    // eslint-disable-next-line no-await-in-loop
    await Review.syncProductRating(product._id);
  }
  logger.info(`Created ${reviewCount} reviews.`);

  /* Orders — spread over the past 60 days across every status ----------- */
  const statusPlan = [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.PENDING,
  ];

  const inStockProducts = createdProducts.filter((product) => product.stock > 0);
  let orderCount = 0;

  for (const [index, status] of statusPlan.entries()) {
    const customer = customers[index % customers.length];
    const lineCount = (index % 3) + 1;

    const items = [];
    for (let line = 0; line < lineCount; line += 1) {
      const product = inStockProducts[(index * 3 + line) % inStockProducts.length];
      if (items.some((item) => item.product.toString() === product._id.toString())) continue;

      const quantity = ((index + line) % 2) + 1;
      const unitPrice = product.discountPrice ?? product.price;

      items.push({
        product: product._id,
        name: product.name,
        image: product.images[0]?.url ?? '',
        brand: product.brand,
        price: unitPrice,
        originalPrice: product.price,
        quantity,
        subtotal: round(unitPrice * quantity),
      });
    }

    const itemsPrice = round(items.reduce((sum, item) => sum + item.subtotal, 0));
    const shippingPrice = itemsPrice >= env.order.freeShippingThreshold ? 0 : env.order.shippingFee;
    const taxPrice = round(itemsPrice * env.order.taxRate);
    const createdAt = new Date(Date.now() - (60 - index * 4) * 24 * 60 * 60 * 1000);

    const address = customer.addresses[0];

    // eslint-disable-next-line no-await-in-loop
    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      },
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice: round(itemsPrice + shippingPrice + taxPrice),
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      status,
      createdAt,
      confirmedAt: status !== ORDER_STATUS.PENDING && status !== ORDER_STATUS.CANCELLED ? createdAt : undefined,
      shippedAt:
        status === ORDER_STATUS.SHIPPED || status === ORDER_STATUS.DELIVERED
          ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
          : undefined,
      deliveredAt:
        status === ORDER_STATUS.DELIVERED
          ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000)
          : undefined,
      cancelledAt: status === ORDER_STATUS.CANCELLED ? new Date(createdAt.getTime() + 3600 * 1000) : undefined,
      cancellationReason: status === ORDER_STATUS.CANCELLED ? 'Customer changed their mind' : '',
      statusHistory: [{ status: ORDER_STATUS.PENDING, changedAt: createdAt, note: 'Order placed' }].concat(
        status === ORDER_STATUS.PENDING ? [] : [{ status, changedAt: createdAt, changedBy: admin._id }]
      ),
    });

    // Non-cancelled orders consumed stock, exactly as a real checkout would.
    if (status !== ORDER_STATUS.CANCELLED) {
      // eslint-disable-next-line no-await-in-loop
      await Promise.all(
        order.items.map((item) =>
          Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity, sold: item.quantity },
          })
        )
      );
    }

    orderCount += 1;
  }
  logger.info(`Created ${orderCount} orders.`);

  /* Extended catalogue — ~90 products per category on top of the curated set. */
  const { seedExtendedCatalogue } = await import('./catalogueSeeder.js');
  await seedExtendedCatalogue({ target: EXTENDED_CATALOGUE_TARGET });

  /* A pre-filled cart for the first customer --------------------------- */
  await Cart.create({
    user: customers[0]._id,
    items: [
      { product: inStockProducts[0]._id, quantity: 1 },
      { product: inStockProducts[3]._id, quantity: 2 },
    ],
  });

  logger.info('--------------------------------------------------');
  logger.info('Seed complete. Sign-in credentials:');
  logger.info(`  Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  logger.info(`  Customer : ${customerSeed[0].email} / ${CUSTOMER_PASSWORD}`);
  logger.info('Change these before deploying anywhere public.');
  logger.info('--------------------------------------------------');
};
