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
    const user = await User.findById(userId);

    // 1. Check 3-Day Cooldown
    const now = new Date();
    if (user.lastSpinDate) {
      const diffTime = Math.abs(now - new Date(user.lastSpinDate));
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays < 3) {
        return res.status(403).json({
          message: `Spin renews in ${Math.ceil(3 - diffDays)} days`,
          spinsAvailable: 0
        });
      }
    }

    // 2. Increment Step
    let spinCount = (user.spinCount || 0) + 1;
    let selectedSegment;

    // 3. Determine Outcome (Win every 6th spin)
    const isWinTurn = spinCount % 6 === 0;

    const config = await ensureConfig();
    const tryAgainSegment = config.segments.find(s => s.couponCode === 'TRYAGAIN') || {
      label: 'No Reward',
      couponCode: 'TRYAGAIN',
      color: '#f5f5f5'
    };

    if (!isWinTurn) {
      // Force Loss
      selectedSegment = tryAgainSegment;
    } else {
      // Force Win: Find a "Spin Reward" coupon from DB
      // "coupon to give is recorded in the admin section" -> isSpinReward: true
      const prizeCoupons = await Coupon.find({
        isSpinReward: true,
        isActive: true,
        validUntil: { $gte: now },
        $expr: {
          $cond: {
            if: { $ne: ["$usageLimit", null] },
            then: { $lt: ["$usedCount", "$usageLimit"] },
            else: true
          }
        }
      });

      if (prizeCoupons.length > 0) {
        // Pick random prize
        const randomIndex = Math.floor(Math.random() * prizeCoupons.length);
        const prize = prizeCoupons[randomIndex];

        // Construct winning segment (Override a winning-looking segment or just send raw)
        // We act as if we hit a "Lucky Draw" or similar segment but with specific coupon
        selectedSegment = {
          label: prize.discountType === 'percentage' ? `${prize.discountValue}% OFF` : `₹${prize.discountValue} OFF`,
          reward: prize.description || 'Special Spin Reward',
          couponCode: prize.code,
          color: '#fde68a', // Gold color for win
          probability: 1 // Doesn't matter
        };
      } else {
        // Fallback if no prizes configured: Give Try Again (or a default small coupon?)
        // Let's fallback to Try Again to avoid errors, and log error
        console.warn('Spin Win Turn but no isSpinReward coupons found!');
        selectedSegment = tryAgainSegment;
        // Don't consume the "Win" turn? Or just bad luck? 
        // Let's count it as used to prevent infinite retry loops.
      }
    }

    // 4. Update User
    user.spinCount = spinCount;
    user.lastSpinDate = new Date();
    // spinsAvailable is legacy, but let's keep it '0' to signify consumed state until next check
    user.spinsAvailable = 0;

    if (selectedSegment.couponCode !== 'TRYAGAIN') {
      user.rewards.push({
        couponCode: selectedSegment.couponCode,
        label: selectedSegment.label,
        wonAt: new Date(),
        isUsed: false
      });
    }

    await user.save();

    res.json({
      success: true,
      segment: selectedSegment, // Frontend accepts this object to display win
      message: selectedSegment.couponCode !== 'TRYAGAIN'
        ? `Congratulations! You won: ${selectedSegment.label}`
        : 'Better luck next time!',
      spinsAvailable: 0
    });

  } catch (error) {
    console.error('Spin Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check usage/spins left
router.get('/check-usage', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    let canSpin = true;
    let message = 'Spin available!';
    let available = 0;

    if (user.lastSpinDate) {
      const now = new Date();
      const diffTime = Math.abs(now - new Date(user.lastSpinDate));
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      if (diffDays < 3) {
        canSpin = false;
        available = 0;
        message = `Next spin in ${Math.ceil(3 - diffDays)} days`;
      } else {
        available = 1;
      }
    } else {
      // Never spun
      available = 1;
    }

    res.json({
      hasUsed: !canSpin,
      spinsAvailable: available,
      message
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

