import express from 'express';
import Coupon from '../../models/Coupon.js';
import { adminAuth } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/auditLog.js';
import { strictLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.use(adminAuth);

// Get all coupons (admin)
router.get('/', auditLog('VIEW', 'COUPON'), async (req, res) => {
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
router.get('/:id', auditLog('VIEW', 'COUPON'), async (req, res) => {
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
router.post(
  '/',
  strictLimiter,
  auditLog('CREATE', 'COUPON'),
  async (req, res) => {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        minPurchase,
        maxDiscount,
        validFrom,
        validUntil,
        usageLimit,
        isActive = true,
      } = req.body;

      // Validate discount value
      if (discountType === 'percentage' && discountValue > 100) {
        return res
          .status(400)
          .json({ message: 'Percentage discount cannot exceed 100%' });
      }

      // Validate dates
      if (new Date(validUntil) < new Date(validFrom)) {
        return res
          .status(400)
          .json({ message: 'Valid until date must be after valid from date' });
      }

      const coupon = new Coupon({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchase: minPurchase || 0,
        maxDiscount,
        validFrom: new Date(validFrom),
        validUntil: new Date(validUntil),
        usageLimit,
        isActive,
        createdBy: req.user._id.toString(),
      });

      const newCoupon = await coupon.save();
      res.status(201).json(newCoupon);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Update coupon
router.put(
  '/:id',
  strictLimiter,
  auditLog('UPDATE', 'COUPON'),
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      const {
        code,
        description,
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
        return res
          .status(400)
          .json({ message: 'Percentage discount cannot exceed 100%' });
      }

      const updatedCoupon = await coupon.save();
      res.json(updatedCoupon);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Coupon code already exists' });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete coupon
router.delete(
  '/:id',
  strictLimiter,
  auditLog('DELETE', 'COUPON'),
  async (req, res) => {
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
  }
);

export default router;

