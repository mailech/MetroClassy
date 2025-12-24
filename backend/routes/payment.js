import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';

const router = express.Router();

// Initialize Razorpay lazily
const getRazorpay = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt } = req.body;

        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency,
            receipt: receipt || `order_${Date.now()}`,
        };

        const razorpay = getRazorpay();
        const razorpayOrder = await razorpay.orders.create(options);

        res.json({
            success: true,
            order: razorpayOrder,
            key_id: process.env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
        console.error('Razorpay order creation error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// Verify Razorpay payment
router.post('/verify-payment', async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId,
        } = req.body;

        // Verify signature
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature === expectedSign) {
            // Payment is verified
            // Update order status
            if (orderId) {
                await Order.findByIdAndUpdate(orderId, {
                    isPaid: true,
                    paidAt: new Date(),
                    paymentResult: {
                        id: razorpay_payment_id,
                        status: 'success',
                        update_time: new Date().toISOString(),
                    },
                });
            }

            res.json({
                success: true,
                message: 'Payment verified successfully',
                payment_id: razorpay_payment_id,
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid signature',
            });
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

export default router;
