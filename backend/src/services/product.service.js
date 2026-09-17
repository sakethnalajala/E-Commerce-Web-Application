import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import ApiError from '../utils/ApiError.js';
import { getPagination, buildPaginationMeta } from '../utils/pagination.js';
import { SORT_OPTIONS, DEFAULT_SORT } from '../utils/constants.js';

/** Escapes user input before it is used inside a RegExp. */
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/**
 * Resolves the ?category filter, which accepts an ObjectId, a slug, or a comma
 * separated mix of both, into concrete category ids.
 */
const resolveCategoryIds = async (categoryParam) => {
  const tokens = splitList(categoryParam);
  if (!tokens.length) return [];

  const ids = tokens.filter((token) => mongoose.isValidObjectId(token));
  const slugs = tokens.filter((token) => !mongoose.isValidObjectId(token));

  if (slugs.length) {
    const matched = await Category.find({ slug: { $in: slugs } }).select('_id').lean();
    ids.push(...matched.map((category) => category._id.toString()));
  }

  // No match at all -> return a sentinel that yields an empty result set rather
  // than silently ignoring the filter.
  if (!ids.length) return [new mongoose.Types.ObjectId()];

  return ids.map((id) => new mongoose.Types.ObjectId(id));
};

/**
 * Translates the public query string into a Mongo filter + sort.
 * Supports any combination of search, filters, sorting and pagination.
 */
export const buildProductQuery = async (query = {}, { includeInactive = false } = {}) => {
  const filter = {};

  if (!includeInactive) filter.isActive = true;
  else if (query.isActive !== undefined && query.isActive !== '') {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search.trim()), 'i');
    filter.$or = [{ name: pattern }, { brand: pattern }];
  }

  const categoryIds = await resolveCategoryIds(query.category);
  if (categoryIds.length) filter.category = { $in: categoryIds };

  const brands = splitList(query.brand);
  if (brands.length) {
    filter.brand = { $in: brands.map((brand) => new RegExp(`^${escapeRegex(brand)}$`, 'i')) };
  }

  const minPrice = Number(query.minPrice);
  const maxPrice = Number(query.maxPrice);
  if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
    filter.effectivePrice = {};
    if (Number.isFinite(minPrice)) filter.effectivePrice.$gte = minPrice;
    if (Number.isFinite(maxPrice)) filter.effectivePrice.$lte = maxPrice;
  }

  const rating = Number(query.rating);
  if (Number.isFinite(rating) && rating > 0) filter.ratingsAverage = { $gte: rating };

  if (query.inStock === true || query.inStock === 'true') filter.stock = { $gt: 0 };
  if (query.inStock === false || query.inStock === 'false') filter.stock = { $lte: 0 };

  if (query.featured === true || query.featured === 'true') filter.isFeatured = true;

  const sortKey = SORT_OPTIONS[query.sort] ? query.sort : DEFAULT_SORT;
  const sort = SORT_OPTIONS[sortKey];

  return { filter, sort, sortKey };
};

export const listProducts = async (query = {}, options = {}) => {
  const { filter, sort, sortKey } = await buildProductQuery(query, options);
  const { page, limit, skip } = getPagination(query);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    meta: { ...buildPaginationMeta({ page, limit, total }), sort: sortKey },
  };
};

/** Looks a product up by ObjectId or slug. */
export const findProductByIdentifier = async (identifier, { includeInactive = false } = {}) => {
  const criteria = mongoose.isValidObjectId(identifier)
    ? { _id: identifier }
    : { slug: identifier };

  if (!includeInactive) criteria.isActive = true;

  const product = await Product.findOne(criteria).populate('category', 'name slug');
  if (!product) throw ApiError.notFound('Product not found.');

  return product;
};

/** Distinct brand list for the storefront filter sidebar. */
export const listBrands = async ({ category } = {}) => {
  const match = { isActive: true };
  const categoryIds = await resolveCategoryIds(category);
  if (categoryIds.length) match.category = { $in: categoryIds };
  const brands = await Product.distinct('brand', match);
  return brands.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

/** Min/max selling price across the active catalogue (or one category), for the price slider. */
export const getPriceRange = async ({ category } = {}) => {
  const match = { isActive: true };
  const categoryIds = await resolveCategoryIds(category);
  if (categoryIds.length) match.category = { $in: categoryIds };
  const [range] = await Product.aggregate([
    { $match: match },
    { $group: { _id: null, minPrice: { $min: '$effectivePrice' }, maxPrice: { $max: '$effectivePrice' } } },
  ]);

  return {
    minPrice: Math.floor(range?.minPrice ?? 0),
    maxPrice: Math.ceil(range?.maxPrice ?? 0),
  };
};

export const getRelatedProducts = async (product, limit = 4) =>
  Product.find({
    _id: { $ne: product._id },
    category: product.category?._id ?? product.category,
    isActive: true,
  })
    .sort({ sold: -1, ratingsAverage: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .lean({ virtuals: true });
