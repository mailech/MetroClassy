import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// Get all coupons
router.get('/', async (req, res) => {
  try {
    const { isActive, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    res.json({
      coupons,
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

// Get single coupon
router.get('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create coupon
router.post('/', async (req, res) => {
  try {
    const {
      code,
      description,
      category,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive = true,
      createdBy = 'admin',
    } = req.body;

    // Validate discount value
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    // Validate dates
    if (new Date(validUntil) < new Date(validFrom)) {
      return res.status(400).json({ message: 'Valid until date must be after valid from date' });
    }

    const coupon = new Coupon({
      code: code.toUpperCase(),
      description,
      category: category || 'all',
      discountType,
      discountValue,
      minPurchase: minPurchase || 0,
      maxDiscount,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit,
      isActive,
      createdBy,
    });

    const newCoupon = await coupon.save();
    res.status(201).json(newCoupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update coupon
router.put('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    const {
      code,
      description,
      category,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
      isActive,
    } = req.body;

    if (code) coupon.code = code.toUpperCase();
    if (description !== undefined) coupon.description = description;
    if (category !== undefined) coupon.category = category;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minPurchase !== undefined) coupon.minPurchase = minPurchase;
    if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
    if (validFrom) coupon.validFrom = new Date(validFrom);
    if (validUntil) coupon.validUntil = new Date(validUntil);
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (isActive !== undefined) coupon.isActive = isActive;

    // Validate discount value
    if (discountType === 'percentage' && discountValue > 100) {
      return res.status(400).json({ message: 'Percentage discount cannot exceed 100%' });
    }

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Delete coupon
router.delete('/:id', async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    await coupon.deleteOne();
    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate coupon (for use in checkout)
router.post('/validate', async (req, res) => {
  try {
    const { code, totalAmount, cartTotal } = req.body;
    const amount = cartTotal !== undefined ? cartTotal : totalAmount;

    if (amount === undefined) {
      return res.status(400).json({ message: 'Cart total is required' });
    }

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    // Check if coupon is within valid date range
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ message: 'Coupon has expired or is not yet valid' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check minimum purchase
    if (amount < coupon.minPurchase) {
      return res.status(400).json({
        message: `Minimum purchase of ₹${coupon.minPurchase} required`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed total amount
    discount = Math.min(discount, amount);

    res.json({
      valid: true,
      isValid: true,
      discount,
      discountAmount: discount,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

