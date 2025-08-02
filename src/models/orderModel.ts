import mongoose, { Schema } from 'mongoose';
import { OrderDocument } from '../types';

const orderItemSchema = new Schema(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Order item must have a book reference'],
    },
    title: {
      type: String,
      required: [true, 'Order item must have a title'],
    },
    quantity: {
      type: Number,
      required: [true, 'Order item must have a quantity'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Order item must have a price'],
      min: [0, 'Price must be a positive number'],
    },
  },
  { _id: true }
);

const orderSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a user'],
    },
    items: [orderItemSchema],
    shippingAddress: {
      street: {
        type: String,
        required: [true, 'Shipping address must have a street'],
      },
      city: {
        type: String,
        required: [true, 'Shipping address must have a city'],
      },
      state: {
        type: String,
        required: [true, 'Shipping address must have a state'],
      },
      zipCode: {
        type: String,
        required: [true, 'Shipping address must have a zip code'],
      },
      country: {
        type: String,
        required: [true, 'Shipping address must have a country'],
      },
    },
    paymentInfo: {
      method: {
        type: String,
        required: [true, 'Payment info must have a method'],
        enum: ['credit_card', 'paypal', 'bank_transfer'],
      },
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Order must have a total amount'],
      min: [0, 'Total amount must be a positive number'],
    },
    status: {
      type: String,
      enum: ['processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'processing',
    },
    trackingNumber: String,
  },
  {
    timestamps: true,
  }
);

// Create indexes for frequently accessed fields
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model<OrderDocument>('Order', orderSchema);

export default Order;