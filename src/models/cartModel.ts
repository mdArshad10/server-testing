import mongoose, { Schema } from 'mongoose';
import { CartDocument } from '../types';

const cartItemSchema = new Schema(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Cart item must have a book reference'],
    },
    title: {
      type: String,
      required: [true, 'Cart item must have a title'],
    },
    quantity: {
      type: Number,
      required: [true, 'Cart item must have a quantity'],
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    price: {
      type: Number,
      required: [true, 'Cart item must have a price'],
      min: [0, 'Price must be a positive number'],
    },
    coverImage: {
      type: String,
      default: 'default-book-cover.jpg',
    },
  },
  { _id: true }
);

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Cart must belong to a user'],
      unique: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

const Cart = mongoose.model<CartDocument>('Cart', cartSchema);

export default Cart;