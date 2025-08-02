import { Request, Response, NextFunction } from 'express';
import Book from '../models/bookModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

// Get all books with pagination and filters
export const getAllBooks = catchAsync(async (req: Request, res: Response) => {
  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Filtering
  const queryObj: any = {};
  
  if (req.query.category) {
    queryObj.category = req.query.category;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    queryObj.price = {};
    if (req.query.minPrice) {
      queryObj.price.$gte = parseFloat(req.query.minPrice as string);
    }
    if (req.query.maxPrice) {
      queryObj.price.$lte = parseFloat(req.query.maxPrice as string);
    }
  }

  if (req.query.isAvailable) {
    queryObj.isAvailable = req.query.isAvailable === 'true';
  }

  // Sorting
  let sortBy = '-createdAt'; // Default sort by newest
  if (req.query.sortBy) {
    const order = req.query.order === 'desc' ? '-' : '';
    sortBy = `${order}${req.query.sortBy}`;
  }

  // Execute query
  const books = await Book.find(queryObj)
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  // Count total results for pagination
  const totalBooks = await Book.countDocuments(queryObj);
  const totalPages = Math.ceil(totalBooks / limit);

  res.status(200).json({
    status: 'success',
    results: books.length,
    totalPages,
    currentPage: page,
    data: books,
  });
});

// Search books by title, author, or description
export const searchBooks = catchAsync(async (req: Request, res: Response) => {
  const query = req.query.query as string;
  
  if (!query) {
    return res.status(400).json({
      status: 'fail',
      message: 'Search query is required',
    });
  }

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Execute search query using text index or regex
  const books = await Book.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);

  // If text search returns no results, fallback to regex
  const totalBooks = books.length > 0 
    ? await Book.countDocuments({ $text: { $search: query } })
    : 0;

  // If text search returns no results, fallback to regex
  if (books.length === 0) {
    const regexQuery = new RegExp(query, 'i');
    const regexBooks = await Book.find({
      $or: [
        { title: regexQuery },
        { author: regexQuery },
        { description: regexQuery },
      ],
    })
      .skip(skip)
      .limit(limit);

    const regexTotalBooks = await Book.countDocuments({
      $or: [
        { title: regexQuery },
        { author: regexQuery },
        { description: regexQuery },
      ],
    });

    const regexTotalPages = Math.ceil(regexTotalBooks / limit);

    return res.status(200).json({
      status: 'success',
      results: regexBooks.length,
      totalPages: regexTotalPages,
      currentPage: page,
      data: regexBooks,
    });
  }

  const totalPages = Math.ceil(totalBooks / limit);

  res.status(200).json({
    status: 'success',
    results: books.length,
    totalPages,
    currentPage: page,
    data: books,
  });
});

// Get book by ID
export const getBookById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: book,
  });
});

// Create new book (admin only)
export const createBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    title,
    author,
    isbn,
    description,
    category,
    price,
    coverImage,
    publisher,
    publicationDate,
    stock,
    pages,
    language,
  } = req.body;

  // Check if book with ISBN already exists
  const existingBook = await Book.findOne({ isbn });
  if (existingBook) {
    return next(new AppError('Book with this ISBN already exists', 400));
  }

  // Create book
  const book = await Book.create({
    title,
    author,
    isbn,
    description,
    category,
    price,
    coverImage,
    publisher,
    publicationDate,
    stock,
    pages,
    language,
    isAvailable: stock > 0,
  });

  res.status(201).json({
    status: 'success',
    message: 'Book created successfully',
    data: book,
  });
});

// Update book (admin only)
export const updateBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    title,
    author,
    description,
    category,
    price,
    coverImage,
    publisher,
    publicationDate,
    stock,
    pages,
    language,
  } = req.body;

  // Don't allow updating ISBN as it's a unique identifier
  if (req.body.isbn) {
    return next(new AppError('ISBN cannot be updated', 400));
  }

  // Build update object
  const updateData: any = {};
  if (title) updateData.title = title;
  if (author) updateData.author = author;
  if (description) updateData.description = description;
  if (category) updateData.category = category;
  if (price !== undefined) updateData.price = price;
  if (coverImage) updateData.coverImage = coverImage;
  if (publisher) updateData.publisher = publisher;
  if (publicationDate) updateData.publicationDate = publicationDate;
  if (stock !== undefined) {
    updateData.stock = stock;
    updateData.isAvailable = stock > 0;
  }
  if (pages) updateData.pages = pages;
  if (language) updateData.language = language;

  // Update book
  const book = await Book.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: book,
  });
});

// Delete book (admin only)
export const deleteBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const book = await Book.findByIdAndDelete(req.params.id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: null,
  });
});