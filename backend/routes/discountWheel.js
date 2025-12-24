import express from 'express';
import DiscountWheel from '../models/DiscountWheel.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const defaultSegments = [
  {
    label: '5% off',
    reward: 'Enjoy 5% off on your cart',
    couponCode: 'METRO5',
    probability: 0.25,
    color: '#c0b6ff',
  },
  {
    label: 'Free Shipping',
    reward: 'Complimentary metro shipping',
    couponCode: 'SHIPFREE',
    probability: 0.2,
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
    probability: 0.1,
    color: '#c7d2fe',
  },
  {
    label: 'No Reward',
    reward: 'Better luck on next spin',
    couponCode: 'TRYAGAIN',
    probability: 0.1,
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

// Spin the wheel (one-time use per user)
router.post('/spin', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { category } = req.body; // Optional category filter
    
    const config = await ensureConfig();
    
    // Check if user has already used the wheel
    if (config.usedBy && config.usedBy.includes(userId)) {
      return res.status(403).json({ 
        message: 'You have already used the discount wheel. Each user can only spin once.',
        alreadyUsed: true 
      });
    }

    // Filter segments by category if provided
    let availableSegments = config.segments.filter(seg => seg.active !== false);
    if (category) {
      availableSegments = availableSegments.filter(seg => 
        !seg.category || seg.category === category || seg.category === ''
      );
    }

    if (availableSegments.length === 0) {
      return res.status(400).json({ message: 'No active segments available for this category' });
    }

    // Normalize probabilities for available segments
    const totalProb = availableSegments.reduce((sum, seg) => sum + (seg.probability || 0), 0);
    if (totalProb === 0) {
      return res.status(400).json({ message: 'No segments with valid probabilities' });
    }

    // Random selection based on probability
    const random = Math.random() * totalProb;
    let cumulative = 0;
    let selectedSegment = null;

    for (const segment of availableSegments) {
      cumulative += segment.probability || 0;
      if (random <= cumulative) {
        selectedSegment = segment;
        break;
      }
    }

    if (!selectedSegment) {
      selectedSegment = availableSegments[availableSegments.length - 1];
    }

    // Mark user as having used the wheel
    if (!config.usedBy) {
      config.usedBy = [];
    }
    if (!config.usedBy.includes(userId)) {
      config.usedBy.push(userId);
      await config.save();
    }

    res.json({
      success: true,
      segment: selectedSegment,
      message: `Congratulations! You won: ${selectedSegment.label}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if user has already used the wheel
router.get('/check-usage', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const config = await ensureConfig();
    
    const hasUsed = config.usedBy && config.usedBy.includes(userId);
    
    res.json({
      hasUsed,
      message: hasUsed ? 'You have already used the discount wheel' : 'You can still use the discount wheel',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

