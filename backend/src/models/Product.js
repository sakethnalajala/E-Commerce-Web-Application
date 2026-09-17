import mongoose from 'mongoose';
import slugify from 'slugify';
import { MAX_PRODUCT_IMAGES } from '../utils/constants.js';

const productImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [3, 'Product name must be at least 3 characters'],
      maxlength: [140, 'Product name cannot exceed 140 characters'],
      index: true,
    },
    slug: { type: String, unique: true, index: true },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      default: null,
      validate: {
        validator(value) {
          return value === null || value === undefined || value < this.price;
        },
        message: 'Discount price must be lower than the original price',
      },
    },
    /**
     * Denormalized selling price (discountPrice ?? price). Persisted so price
     * filtering and price sorting can run as indexed queries in MongoDB rather
     * than being computed in application code.
     */
    effectivePrice: { type: Number, index: true },
    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: (images) => images.length <= MAX_PRODUCT_IMAGES,
        message: `A product cannot have more than ${MAX_PRODUCT_IMAGES} images`,
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      maxlength: [60, 'Brand cannot exceed 60 characters'],
      index: true,
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    sold: { type: Number, default: 0, min: 0 },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (value) => Math.round(value * 10) / 10,
    },
    ratingsCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Common storefront query shape: active products in a category sorted by price.
productSchema.index({ isActive: 1, category: 1, effectivePrice: 1 });
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ name: 'text', brand: 'text', description: 'text' });

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'product',
});

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('discountPercentage').get(function discountPercentage() {
  if (!this.discountPrice || this.discountPrice >= this.price) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

productSchema.pre('validate', function normalize(next) {
  if (this.isModified('name') && this.name) {
    // Suffix keeps slugs unique for products that share a name.
    const base = slugify(this.name, { lower: true, strict: true });
    this.slug = `${base}-${this._id.toString().slice(-6)}`;
  }

  if (this.discountPrice === '' || this.discountPrice === undefined) {
    this.discountPrice = null;
  }

  this.effectivePrice =
    this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;

  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
