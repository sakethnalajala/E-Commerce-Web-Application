import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * One cart per authenticated user. Deliberately stores only product references
 * and quantities — prices and stock are always re-read from the Product
 * collection so a stale cart can never influence what a customer is charged.
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

cartSchema.methods.findItem = function findItem(productId) {
  return this.items.find((item) => item.product.toString() === productId.toString());
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
