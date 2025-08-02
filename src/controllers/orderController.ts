import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Cart from "../models/cartModel";
import Order from "../models/orderModel";
import Book from "../models/bookModel";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/appError";

// Get user's cart
export const getCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Create an empty cart if none exists
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    // Calculate total
    const total = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    res.status(200).json({
      status: "success",
      data: {
        cart,
        total,
      },
    });
  }
);

// Add item to cart
export const addToCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const { bookId, quantity = 1 } = req.body;

    // Validate book existence and availability
    const book = await Book.findById(bookId);
    if (!book) {
      return next(new AppError("Book not found", 404));
    }

    if (!book.isAvailable || book.stock < quantity) {
      return next(
        new AppError("Book is not available in the requested quantity", 400)
      );
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [],
      });
    }

    // Check if book already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.bookId.toString() === bookId
    );

    if (existingItemIndex > -1) {
      // Update quantity if book already in cart
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      // const bookID = new mongoose.Types.ObjectId(bookId);
      cart.items.push({
        bookId: bookId,
        title: book.title,
        quantity,
        price: book.price,
        coverImage: book.coverImage,
      });
    }

    // Save updated cart
    await cart.save();

    // Calculate total
    const total = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    res.status(200).json({
      status: "success",
      message: "Item added to cart",
      data: {
        cart,
        total,
      },
    });
  }
);

// Remove item from cart
export const removeFromCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    // Find item index
    const itemIndex = cart.items.findIndex(
      (item) => item.bookId.toString() === itemId
    );
    if (itemIndex === -1) {
      return next(new AppError("Item not found in cart", 404));
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    await cart.save();

    // Calculate total
    const total = cart.items.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    res.status(200).json({
      status: "success",
      message: "Item removed from cart",
      data: {
        cart,
        total,
      },
    });
  }
);

// Clear cart
export const clearCart = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;

    // Get cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return next(new AppError("Cart not found", 404));
    }

    // Clear items
    cart.items = [];
    await cart.save();

    res.status(200).json({
      status: "success",
      message: "Cart cleared",
    });
  }
);

// Create new order from cart
export const createOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const { shippingAddress, paymentInfo } = req.body;

    try {
      // Get cart
      const cart = await Cart.findOne({ userId });
      if (!cart || cart.items.length === 0) {
        return next(new AppError("Cart is empty", 400));
      }

      // Validate and update book stock
      for (const item of cart.items) {
        const book = await Book.findById(item.bookId);
        if (!book || !book.isAvailable || book.stock < item.quantity) {
          return next(
            new AppError(
              `Book "${item.title}" is not available in requested quantity`,
              400
            )
          );
        }

        // Update book stock
        book.stock -= item.quantity;
        book.isAvailable = book.stock > 0;
        await book.save(); // No session
      }

      // Calculate total amount
      const totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      // Format order items
      const orderItems = cart.items.map((item) => ({
        bookId: item.bookId,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
      }));

      // Create order (no session)
      const order = await Order.create({
        userId,
        items: orderItems,
        shippingAddress,
        paymentInfo,
        totalAmount,
        status: "processing",
      });

      // Clear cart
      cart.items = [];
      await cart.save(); // No session

      res.status(201).json({
        status: "success",
        data: {
          order,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);


// Get user's orders
export const getUserOrders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;

  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Get orders
  const orders = await Order.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Count total orders
  const totalOrders = await Order.countDocuments({ userId });
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: "success",
    results: orders.length,
    totalPages,
    currentPage: page,
    data: orders,
  });
});

// Get order details
export const getOrderById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    // Get order (users can only see their own orders unless they're admin)
    const orderQuery =
      req.user.role === "admin" ? { _id: orderId } : { _id: orderId, userId };

    const order = await Order.findOne(orderQuery);

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  }
);

// Cancel order
export const cancelOrder = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const orderId = req.params.id;

    // Start session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get order (users can only cancel their own orders unless they're admin)
      const orderQuery =
        req.user.role === "admin" ? { _id: orderId } : { _id: orderId, userId };

      const order = await Order.findOne(orderQuery).session(session);

      if (!order) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError("Order not found", 404));
      }

      // Check if order can be cancelled
      if (order.status !== "processing") {
        await session.abortTransaction();
        session.endSession();
        return next(
          new AppError(
            `Order cannot be cancelled in '${order.status}' status`,
            400
          )
        );
      }

      // Update order status
      order.status = "cancelled";
      await order.save({ session });

      // Restore book stock
      for (const item of order.items) {
        const book = await Book.findById(item.bookId).session(session);
        if (book) {
          book.stock += item.quantity;
          book.isAvailable = book.stock > 0;
          await book.save({ session });
        }
      }

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        data: {
          order,
        },
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      next(error);
    }
  }
);

// Admin: Get all orders
export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Filtering
  const queryObj: any = {};

  if (req.query.status) {
    queryObj.status = req.query.status;
  }

  if (req.query.userId) {
    queryObj.userId = req.query.userId;
  }

  // Get orders
  const orders = await Order.find(queryObj)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Count total orders
  const totalOrders = await Order.countDocuments(queryObj);
  const totalPages = Math.ceil(totalOrders / limit);

  res.status(200).json({
    status: "success",
    results: orders.length,
    totalPages,
    currentPage: page,
    data: orders,
  });
});

// Admin: Update order status
export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { status, trackingNumber } = req.body;

    // Validate status
    const validStatuses = [
      "processing",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];
    if (status && !validStatuses.includes(status)) {
      return next(new AppError("Invalid order status", 400));
    }

    // Update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber) updateData.trackingNumber = trackingNumber;

    // Update order
    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      status: "success",
      data: {
        order,
      },
    });
  }
);
