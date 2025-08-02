import mongoose, { Schema } from 'mongoose';
import { BookDocument } from '../types';

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Book must have a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Book must have an author'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'Book must have an ISBN'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Book must have a description'],
    },
    category: {
      type: String,
      required: [true, 'Book must have a category'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Romance',
        'Mystery',
        'Fantasy',
        'Other',
      ],
    },
    price: {
      type: Number,
      required: [true, 'Book must have a price'],
      min: [0, 'Price must be a positive number'],
    },
    coverImage: {
      type: String,
      default: 'default-book-cover.jpg',
    },
    publisher: {
      type: String,
      required: [true, 'Book must have a publisher'],
    },
    publicationDate: {
      type: Date,
      required: [true, 'Book must have a publication date'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    pages: {
      type: Number,
      required: [true, 'Book must have a page count'],
      min: [1, 'Page count must be at least 1'],
    },
    language: {
      type: String,
      default: 'English',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common search fields
bookSchema.index({ title: 'text', author: 'text', category: 1 });
bookSchema.index({ price: 1 });

const Book = mongoose.model<BookDocument>('Book', bookSchema);

export default Book;