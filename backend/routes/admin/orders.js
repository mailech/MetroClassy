import express from 'express';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import { adminAuth } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/auditLog.js';
import { strictLimiter } from '../../middleware/rateLimiter.js';
import sendSMS from '../../utils/sendSMS.js';
import sendEmail from '../../utils/sendEmail.js';

const router = express.Router();

router.use(adminAuth);

// Get all orders with filters (admin version)
router.get('/', auditLog('VIEW', 'ORDER'), async (req, res) => {
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

// Get single order
router.get('/:id', auditLog('VIEW', 'ORDER'), async (req, res) => {
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
router.put(
  '/:id/status',
  strictLimiter,
  auditLog('STATUS_CHANGE', 'ORDER'),
  async (req, res) => {
    try {
      const { status, trackingNumber } = req.body;

      const order = await Order.findById(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const oldStatus = order.status;

      if (status) {
        order.status = status;
        if (status === 'delivered') {
          order.isDelivered = true;
          order.deliveredAt = new Date();
        } else if (status === 'cancelled' && oldStatus !== 'cancelled') {
          // Restore stock when order is cancelled
          for (const item of order.orderItems) {
            if (item.product) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { countInStock: item.qty },
              });
            }
          }
        }
      }

      if (trackingNumber) {
        order.trackingNumber = trackingNumber;
        if (!order.status || order.status === 'pending') {
          order.status = 'shipped';
        }
      }

      await order.save();

      // Send Email to Customer on Status Change
      try {
        await order.populate('user', 'name email phone');

        // Ensure user is populated
        if (order.user && order.user.email) {
          const statusMessage = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4f46e5;">Order Status Update</h1>
                <p>Hi ${order.user.name},</p>
                <p>There is an update on your order <strong>#${order.orderNumber}</strong>.</p>
                
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 6px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 18px;">Current Status: <strong style="color: #166534; text-transform: uppercase;">${status}</strong></p>
                </div>

                ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
                
                <p>Thank you for shopping with MetroClassy!</p>
              </div>
            `;



          // SEND EMAIL
          await sendEmail({ // Helper function needs to be imported if not already? It is imported in orders.js but need to check admin/orders.js
            email: order.user.email,
            subject: `Order Update: #${order.orderNumber} is ${status}`,
            message: statusMessage
          });
          console.log(`[Email Success] Status update sent to user: ${order.user.email}`);
        }
      } catch (emailError) {
        console.error('[Email Error] Failed to send status email:', emailError);
      }

      res.json(order);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Update payment status
router.put(
  '/:id/payment',
  strictLimiter,
  auditLog('STATUS_CHANGE', 'ORDER'),
  async (req, res) => {
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
  }
);

export default router;

