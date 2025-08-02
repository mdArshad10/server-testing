import express from 'express';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { orderValidationRules, validate } from '../middleware/validationMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Cart routes
router.get('/cart', getCart);
router.post('/cart', orderValidationRules.addToCart, validate, addToCart);
router.delete('/cart/:itemId', removeFromCart);
router.delete('/cart', clearCart);

// Order routes
router.post('/', orderValidationRules.createOrder, validate, createOrder);
router.get('/', getUserOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

// Admin routes
router.use(restrictTo('admin'));

router.get('/admin/all', getAllOrders);
router.patch('/admin/:id', updateOrderStatus);

export default router;