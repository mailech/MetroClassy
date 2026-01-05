import express from 'express';
import DiscountWheel from '../models/DiscountWheel.js';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const defaultSegments = [
  {
    label: '5% off',
    reward: 'Enjoy 5% off on your cart',
    couponCode: 'METRO5',
    probability: 0.3,
    color: '#c0b6ff',
  },
  {
    label: 'Free Shipping',
    reward: 'Complimentary metro shipping',
    couponCode: 'SHIPFREE',
    probability: 0.25,
    color: '#ffc0cb',
  },
  {
    label: '10% off',
    reward: 'Limited 10% drop',
    couponCode: 'METRO10',
    probability: 0.2,
    color: '#a5f3fc',
  },
  {
    label: '15% off',
    reward: 'Signature insignia 15%',
    couponCode: 'METRO15',
    probability: 0.15,
    color: '#fde68a',
  },
  {
    label: 'Lucky Draw',
    reward: 'Access to next capsule early',
    couponCode: 'EARLYPASS',
    probability: 0.05,
    color: '#c7d2fe',
  },
  {
    label: 'No Reward',
    reward: 'Better luck on next spin',
    couponCode: 'TRYAGAIN',
    probability: 0.05,
    color: '#f5f5f5',
  },
];

const ensureConfig = async () => {
  let config = await DiscountWheel.findOne();
  if (!config) {
    config = await DiscountWheel.create({
      segments: defaultSegments,
      updatedBy: 'system-seed',
    });
  }
  return config;
};

// Fetch current wheel configuration
router.get('/', async (req, res) => {
  try {
    const config = await ensureConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update wheel segments
router.put('/', async (req, res) => {
  try {
    const { segments, updatedBy = 'admin' } = req.body;
    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ message: 'Segments array is required' });
    }

    const totalProbability = segments
      .filter((seg) => seg.active !== false)
      .reduce((sum, seg) => sum + Number(seg.probability || 0), 0);

    if (Math.abs(totalProbability - 1) > 0.0001) {
      return res
        .status(400)
        .json({ message: 'Active segment probabilities must sum to 1' });
    }

    const config = await ensureConfig();
    config.segments = segments;
    config.updatedBy = updatedBy;
    await config.save();

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Spin the wheel
router.post('/spin', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.body;

    const user = await User.findById(userId);

    // Legacy migration: If spinsAvailable is undefined, set it based on previous usage
    if (user.spinsAvailable === undefined) {
      const config = await ensureConfig();
      // If they used it before, they have 0 left. If not, give them 1 (as per "old users get 1" request).
      // However, if we want to be generous or follow the strict "renew" request, we might just give 1.
      // Let's check the old config to be safe, but prioritize the new rule.
      const usedBefore = config.usedBy && config.usedBy.includes(userId);
      user.spinsAvailable = usedBefore ? 0 : 1;
      await user.save();
    }

    if (user.spinsAvailable <= 0) {
      return res.status(403).json({
        message: 'No spins remaining.',
        spinsAvailable: 0
      });
    }



    const config = await ensureConfig();
    let availableSegments = config.segments.filter(seg => seg.active !== false);

    // Filter by Category
    if (category) {
      availableSegments = availableSegments.filter(seg =>
        !seg.category || seg.category === category || seg.category === ''
      );
    }

    // NEW: Filter out segments linked to invalid/exhausted coupons
    // We get all unique codes from segments
    const segmentCodes = [...new Set(availableSegments.map(s => s.couponCode))];

    // Find valid coupons in DB
    const validCoupons = await Coupon.find({
      code: { $in: segmentCodes },
      isActive: true,
      validUntil: { $gte: new Date() }, // Not expired
      $expr: {
        $cond: {
          if: { $ne: ["$usageLimit", null] },
          then: { $lt: ["$usedCount", "$usageLimit"] },
          else: true
        }
      }
    });

    const validCodeMap = new Set(validCoupons.map(c => c.code));

    // Keep segments that are either standard (no DB coupon like TRYAGAIN) or have valid DB coupon
    // We assume 'TRYAGAIN' is always valid.
    availableSegments = availableSegments.filter(seg =>
      seg.couponCode === 'TRYAGAIN' || validCodeMap.has(seg.couponCode)
    );

    if (availableSegments.length === 0) {
      return res.status(400).json({ message: 'No active rewards available at the moment' });
    }

    const totalProb = availableSegments.reduce((sum, seg) => sum + (seg.probability || 0), 0);
    const random = Math.random() * totalProb;
    let cumulative = 0;
    let selectedSegment = availableSegments[availableSegments.length - 1];

    for (const segment of availableSegments) {
      cumulative += segment.probability || 0;
      if (random <= cumulative) {
        selectedSegment = segment;
        break;
      }
    }

    // Decrement spins and save reward
    user.spinsAvailable -= 1;
    user.rewards.push({
      couponCode: selectedSegment.couponCode,
      label: selectedSegment.label,
      wonAt: new Date(),
      isUsed: false
    });

    await user.save();

    res.json({
      success: true,
      segment: selectedSegment,
      message: `Congratulations! You won: ${selectedSegment.label}`,
      spinsAvailable: user.spinsAvailable
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check usage/spins left
router.get('/check-usage', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Initialize if logic hasn't run yet
    let spins = user.spinsAvailable;
    if (spins === undefined) {
      const config = await ensureConfig();
      const usedBefore = config.usedBy && config.usedBy.includes(req.user._id);
      spins = usedBefore ? 0 : 1;
      // We do not save here to avoid side effects on GET, unless we want to persist migration immediately.
      // Let's return the computed value.
    }

    res.json({
      hasUsed: spins <= 0,
      spinsAvailable: spins,
      message: spins > 0 ? `You have ${spins} spins available` : 'No spins remaining'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

