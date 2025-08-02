import express from 'express';
import {
  getAllBooks,
  searchBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from '../controllers/bookController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { bookValidationRules, validate } from '../middleware/validationMiddleware';

const router = express.Router();

// Public routes
router.get('/', bookValidationRules.getBooks, validate, getAllBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);

// Admin routes (protected)
router.use(protect);
router.use(restrictTo('admin'));

router.post('/', bookValidationRules.createBook, validate, createBook);
router.patch('/:id', updateBook);
router.delete('/:id', deleteBook);

export default router;