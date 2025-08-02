import express from 'express';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateUser,
  changePassword,
  deleteUser,
  getAllUsers,
  getUserById,
  adminUpdateUser,
} from '../controllers/userController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { userValidationRules, validate } from '../middleware/validationMiddleware';

const router = express.Router();

// Public routes
router.post('/register', userValidationRules.register, validate, registerUser);
router.post('/login', userValidationRules.login, validate, loginUser);

// Protected routes (require authentication)
router.use(protect);

router.get('/current', getCurrentUser);
router.patch('/update', userValidationRules.updateUser, validate, updateUser);
router.post('/change-password', userValidationRules.changePassword, validate, changePassword);
router.delete('/delete', deleteUser);

// Admin routes
router.use(restrictTo('admin'));

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.patch('/:id', userValidationRules.updateUser, validate, adminUpdateUser);

export default router;