import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [3, 'Comment must be at least 3 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    // Set when the reviewer has a delivered order containing this product.
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// One review per user per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

/**
 * Recomputes a product's rating aggregate from its reviews. Called after every
 * review create/update/delete so Product.ratingsAverage is never stale.
 */
reviewSchema.statics.syncProductRating = async function syncProductRating(productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        ratingsAverage: { $avg: '$rating' },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model('Product').findByIdAndUpdate(productId, {
    ratingsAverage: stats?.ratingsAverage ?? 0,
    ratingsCount: stats?.ratingsCount ?? 0,
  });

  return stats ?? { ratingsAverage: 0, ratingsCount: 0 };
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
