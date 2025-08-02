import { Request, Response, NextFunction } from 'express';
import User from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/jwtUtils';

// User registration
export const registerUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, phoneNumber, address } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return next(new AppError('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    address,
    role: 'admin'
  });

  // Generate token
  const token = signToken(user._id.toString(), user.role);

  // Don't include password in response
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    address: user.address,
    isActive: user.isActive,
  };

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: userWithoutPassword,
    },
  });
});

// User login
export const loginUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated', 401));
  }

  // Generate token
  const token = signToken(user._id.toString(), user.role);

  // Don't include password in response
  const userWithoutPassword = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phoneNumber: user.phoneNumber,
    address: user.address,
    isActive: user.isActive,
  };

  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: userWithoutPassword,
    },
  });
});

// Get current user profile
export const getCurrentUser = catchAsync(async (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
});

// Update user profile
export const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phoneNumber, address } = req.body;

  // Check if user is trying to update password
  if (req.body.password) {
    return next(new AppError('This route is not for password updates. Please use /change-password', 400));
  }

  // Build update object
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (address) updateData.address = address;

  // Update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Change password
export const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  // Get user from database with password
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if current password is correct
  if (!(await user.matchPassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = signToken(user._id.toString(), user.role);

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully',
    token,
  });
});

// Delete user (deactivate)
export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Instead of actually deleting, just mark as inactive
  const user = await User.findByIdAndUpdate(req.user.id, { isActive: false });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: null,
  });
});

// Admin: Get all users
export const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find()
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments();
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    totalPages,
    currentPage: page,
    data: {
      users,
    },
  });
});

// Admin: Get user by ID
export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

// Admin: Update user
export const adminUpdateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, role, phoneNumber, address, isActive } = req.body;

  // Build update object
  const updateData: any = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (phoneNumber) updateData.phoneNumber = phoneNumber;
  if (address) updateData.address = address;
  if (isActive !== undefined) updateData.isActive = isActive;

  // Update user
  const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});