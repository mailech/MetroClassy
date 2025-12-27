import express from 'express';
import path from 'path';
import fs from 'fs';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { requireAuth, verifyToken } from '../middleware/auth.js';
import sendEmail from '../utils/sendEmail.js';
import sendSMS from '../utils/sendSMS.js';

const router = express.Router();

const BACKEND_URL = process.env.NODE_ENV === 'production'
  ? (process.env.BACKEND_URL || 'https://metroclassy.vercel.app')
  : 'http://localhost:5000';

// Get all orders with filters
router.get('/', async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (paymentStatus === 'paid') {
      query.isPaid = true;
    } else if (paymentStatus === 'unpaid') {
      query.isPaid = false;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { trackingNumber: { $regex: search, $options: 'i' } },
        { couponCode: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name image')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Authenticated user orders
router.get('/my', requireAuth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('orderItems.product', 'name image price')
      .sort({ createdAt: -1 })
      .limit(10);
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      couponCode,
      discount,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No order items provided' });
    }

    // Try to get user from auth (optional - supports both authenticated and guest orders)
    let userId = null;
    try {
      // Check for Bearer token first
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = await verifyToken(token);
        if (decoded) {
          const user = await User.findById(decoded.userId);
          if (user) userId = user._id;
        }
      }
      // Check for cookie-based session
      else if (req.cookies && req.cookies.token) {
        const session = await Session.findOne({ token: req.cookies.token }).populate('user');
        if (session && session.user && session.expiresAt > new Date()) {
          userId = session.user._id;
        }
      }
    } catch (authError) {
      // If auth fails, continue as guest order
      console.log('Auth check failed, proceeding as guest order');
    }

    // Fallback to userId from request body if provided
    if (!userId && req.body.userId) {
      userId = req.body.userId;
    }


    // Manually populate req.user for SMS logic later
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        req.user = user;
      }
    }

    // Generate order number
    const orderNumber = `MC${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create order
    const order = new Order({
      user: userId,
      orderNumber,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'upi',
      itemsPrice: itemsPrice || totalPrice,
      shippingPrice: shippingPrice || 0,
      taxPrice: taxPrice || 0,
      totalPrice: totalPrice,
      couponCode: couponCode || null,
      discountPrice: discount || req.body.discountPrice || 0, // Mapped correctly to schema
      isPaid: false,
      status: 'pending',
    });

    const createdOrder = await order.save();

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -(item.qty || 1) },
      });
    }

    // SMS Removed as per user request (switched to Email)
    console.log('[Order Debug] SMS disabled. Notifications sent via Email.');

    // Update user's orders array and totalSpent if user is authenticated
    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, {
          $push: { orders: createdOrder._id },
          $inc: { totalSpent: totalPrice },
        });
      } catch (userUpdateError) {
        console.error('Failed to update user orders:', userUpdateError);
        // Don't fail the order creation if user update fails
      }

      // Send email to Admin
      try {
        const attachments = [];

        // Pre-process items to validate/fetch images
        const enrichedItems = await Promise.all(createdOrder.orderItems.map(async (item) => {
          let imageUrl = item.image;
          try {
            // Dynamic import to avoid top-level issues
            const ProductImage = (await import('../models/ProductImage.js')).default;

            // Try to find a fresh image from ProductImage collection first
            const freshImage = await ProductImage.findOne({ product: item.product }).sort({ order: 1 });

            // Fix: ProductImage model uses 'url' field, not 'image'
            if (freshImage && freshImage.url) {
              imageUrl = freshImage.url;
            } else {
              // Fallback to Product model if no ProductImage found
              // Note: Product model uses 'image' field
              const product = await Product.findById(item.product);
              if (product && product.image) {
                imageUrl = product.image;
              }
            }
          } catch (err) {
            console.log(`[Email Debug] Failed to lookup fresh image for ${item.name}`, err);
          }

          // Ensure we have a clean URL
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            // Determine backend URL dynamically if env var is missing or incorrect
            // This handles cases where BACKEND_URL might default to frontend URL
            const protocol = req.protocol;
            const host = req.get('host');
            const dynamicBackendUrl = `${protocol}://${host}`;

            // Prefer env var if it's explicitly set to a remote URL, otherwise use dynamic
            const baseUrl = (process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith('http'))
              ? process.env.BACKEND_URL
              : dynamicBackendUrl;

            imageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
          }

          // Final fallback if image is still missing or invalid
          if (!imageUrl) {
            imageUrl = 'https://placehold.co/150x150?text=No+Image';
          }

          return { ...item.toObject(), finalImage: imageUrl };
        }));

        const orderItemsHtml = enrichedItems.map((item, index) => {
          let imgTag = '';
          if (item.finalImage) {
            imgTag = `<img src="${item.finalImage}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px;" />`;
          }
          return `
              <li style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; align-items: center;">
                 ${imgTag}
                 <div>
                   <strong>${item.name}</strong><br/>
                   Size: ${item.size || 'N/A'} | Color: ${item.color || 'N/A'} | Qty: ${item.qty} x ₹${item.price}
                 </div>
              </li>`;
        }).join('');

        const isCod = createdOrder.paymentMethod === 'cod' || createdOrder.paymentMethod === 'Cash on Delivery';
        const paymentStatusText = createdOrder.isPaid
          ? 'Payment Successful'
          : (isCod ? 'Pending Payment (Cash on Delivery)' : 'Pending Payment');

        const customerPhone = req.user?.phone || createdOrder.shippingAddress?.phone || 'Not Provided';

        const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #4f46e5;">New Order Received!</h1>
          <p>You have received a new order on MetroClassy.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${createdOrder.orderNumber}</p>
            <p><strong>Total Amount:</strong> ₹${createdOrder.totalPrice}</p>
            <p><strong>Payment Method:</strong> ${createdOrder.paymentMethod.toUpperCase()}</p>
            <p><strong>Status:</strong> ${paymentStatusText}</p>
            <p><strong>Customer Mobile:</strong> ${customerPhone}</p>
          </div>
          
          <h3>Order Items:</h3>
          <ul style="list-style: none; padding: 0;">
            ${orderItemsHtml}
          </ul>

          <h3>Shipping Address:</h3>
          <p>
            ${createdOrder.shippingAddress.address}<br/>
            ${createdOrder.shippingAddress.city}, ${createdOrder.shippingAddress.postalCode}<br/>
            ${createdOrder.shippingAddress.country}
          </p>
        </div>
      `;

        await sendEmail({
          email: process.env.ADMIN_EMAIL || 'aidenaiden.3108@gmail.com',
          subject: `New Order Alert: ${createdOrder.orderNumber}`,
          message,
          attachments,
        });
        console.log('Order notification email sent to admin');
      } catch (emailError) {
        console.error('Failed to send order email:', emailError);
        // Ensure we don't fail the request just because email failed
      }
    }



    // -------------------------------------------------------------------------
    // SEND ORDER CONFIRMATION EMAIL TO CUSTOMER
    // -------------------------------------------------------------------------
    if (req.user && req.user.email) {
      try {
        const customerMessage = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4f46e5; margin: 0;">Order Confirmed!</h1>
              <p style="font-size: 16px; color: #666;">Hi ${req.user.name}, thanks for your order.</p>
            </div>
            
            <div style="background: #fdfdfd; border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
              <p style="margin: 5px 0;"><strong>Order Number:</strong> ${createdOrder.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Payment Status:</strong> ${createdOrder.isPaid ? 'Paid' : 'Pending Payment'}</p>
              <h2 style="color: #4f46e5; margin-top: 15px;">Total: ₹${createdOrder.totalPrice}</h2>
            </div>
            
            <p>We've received your order and are getting it ready!</p>
            <p>You can track your order status in your <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/profile" style="color: #4f46e5;">Profile</a>.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #999;">
              <p>MetroClassy Inc.</p>
            </div>
          </div>
        `;

        await sendEmail({
          email: req.user.email,
          subject: `Order Confirmation: ${createdOrder.orderNumber} - MetroClassy`,
          message: customerMessage,
          // We can optionally reuse attachments if needed, but simple HTML is often safer for immediate confirms
        });
        console.log(`[Email Success] Order confirmation sent to customer: ${req.user.email}`);
      } catch (customerEmailError) {
        console.error('[Email Error] Failed to send customer confirmation:', customerEmailError);
      }
    }

    res.status(201).json({
      message: 'Order created successfully',
      orderNumber: createdOrder.orderNumber,
      order: createdOrder,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) {
      order.status = status;
      if (status === 'delivered') {
        order.isDelivered = true;
        order.deliveredAt = new Date();
      }
    }

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
      if (!order.status || order.status === 'pending') {
        order.deliveredAt = Date.now();
      }
    }

    const updatedOrder = await order.save();

    // Send SMS on status update
    await updatedOrder.populate('user', 'name email phone');

    const targetPhone = updatedOrder.user?.phone || updatedOrder.shippingAddress?.phone;
    const displayOrderId = updatedOrder.orderNumber || updatedOrder._id;

    if (targetPhone) {
      // Ensure E.164
      let formattedPhone = targetPhone;
      if (!formattedPhone.startsWith('+')) formattedPhone = `+91${formattedPhone}`;

      console.log(`[Order Status Debug] Sending SMS to ${formattedPhone} for Order ${displayOrderId}`);
      await sendSMS(formattedPhone, `Update for Order #${displayOrderId}: Your order is now ${status}.`);
    } else {
      console.log(`[Order Status Debug] No phone number found for Order ${displayOrderId}`);
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel Order
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const currentStatus = order.status.toLowerCase();
    if (currentStatus !== 'pending' && currentStatus !== 'processing') {
      return res.status(400).json({ message: `Cannot cancel order in ${order.status} status` });
    }

    order.status = 'cancelled';
    const updatedOrder = await order.save();

    // Send Cancellation Email to Admin
    try {
      await updatedOrder.populate('user', 'name email phone');
      const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #ef4444;">Order Cancelled</h1>
          <p>Order <strong>${updatedOrder.orderNumber}</strong> has been cancelled by the customer.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Order Number:</strong> ${updatedOrder.orderNumber}</p>
            <p><strong>Customer:</strong> ${updatedOrder.user?.name} (${updatedOrder.user?.email})</p>
            <p><strong>Reason:</strong> Customer requested cancellation via Dashboard.</p>
            <p><strong>Total Amount:</strong> ₹${updatedOrder.totalPrice}</p>
          </div>
          <p>Please take necessary action (e.g., refund if paid).</p>
        </div>
      `;

      await sendEmail({
        email: process.env.ADMIN_EMAIL || 'aidenaiden.3108@gmail.com',
        subject: `Order Cancelled: ${updatedOrder.orderNumber}`,
        message,
      });
      console.log('Cancellation notification sent to admin');
    } catch (emailErr) {
      console.error('Failed to send cancellation email', emailErr);
    }

    res.json({ message: 'Order cancelled successfully', order: updatedOrder });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Shipping Address
router.put('/:id/address', requireAuth, async (req, res) => {
  try {
    const { address, city, postalCode, country } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.status !== 'Pending' && order.status !== 'Processing') {
      return res.status(400).json({ message: `Cannot edit address for order in ${order.status} status` });
    }

    // Update address fields
    if (address) order.shippingAddress.address = address; // Note: schema might use 'address' or 'street'
    if (city) order.shippingAddress.city = city;
    if (postalCode) order.shippingAddress.postalCode = postalCode;
    // ... map other fields if necessary

    // Note: The schema in Order.js usually has 'address', 'city', 'postalCode', 'country' nested in 'shippingAddress'
    // Let's assume standard structure:
    if (req.body.shippingAddress) {
      order.shippingAddress = { ...order.shippingAddress, ...req.body.shippingAddress };
    }

    const updatedOrder = await order.save();
    res.json({ message: 'Address updated successfully', order: updatedOrder });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update payment status
router.put('/:id/payment', async (req, res) => {
  try {
    const { isPaid, paymentResult } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isPaid = isPaid !== undefined ? isPaid : order.isPaid;
    if (isPaid) {
      order.paidAt = new Date();
    }
    if (paymentResult) {
      order.paymentResult = paymentResult;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete order
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Restore stock if order is cancelled
    if (order.status === 'cancelled' || order.status === 'pending') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.qty },
        });
      }
    }

    await order.deleteOne();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

