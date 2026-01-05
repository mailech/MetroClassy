import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Coupon from '../models/Coupon.js';
import Session from '../models/Session.js';
import { generateToken, requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';
import axios from 'axios';

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const attachSessionCookie = (res, token) => {
  res.cookie('token', token, cookieOptions);
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Fetch 3 random active coupons for new user
    const starterCoupons = await Coupon.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: 3 } }
    ]);

    const initialRewards = starterCoupons.map(coupon => ({
      couponCode: coupon.code,
      label: `Welcome Gift: ${coupon.code}`,
      wonAt: new Date(),
      isUsed: false
    }));

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      rewards: initialRewards,
      spinsAvailable: 0, // Legacy support
      spinCount: 0,
      lastSpinDate: null
    });

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);
    await Session.create({
      token: sessionToken,
      user: user._id,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    attachSessionCookie(res, sessionToken);

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rewards: user.rewards,
        spinsAvailable: user.spinsAvailable,
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.isAdmin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Only check password if user has one (avoid error for google-only users trying to login with password)
    if (user.password) {
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      return res.status(401).json({ message: 'Please login with Google' });
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);
    await Session.create({
      token: sessionToken,
      user: user._id,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    attachSessionCookie(res, sessionToken);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        rewards: user.rewards,
        spinsAvailable: user.spinsAvailable,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, googleId, mobile } = req.body;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // User exists, ALWAYS update phone if provided (User intent overrides db)
      if (mobile) {
        user.phone = mobile;
      }
      // Link googleId if not linked
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.picture) user.picture = picture;
      }
      await user.save();
    } else {
      // Create new user
      // Fetch 3 random active coupons for new user
      const starterCoupons = await Coupon.aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 3 } }
      ]);

      const initialRewards = starterCoupons.map(coupon => ({
        couponCode: coupon.code,
        label: `Welcome Gift: ${coupon.code}`,
        wonAt: new Date(),
        isUsed: false
      }));

      user = await User.create({
        name,
        email: email.toLowerCase(),
        picture,
        googleId,
        phone: mobile, // Map mobile from frontend to phone
        rewards: initialRewards,
        spinsAvailable: 0,
        spinCount: 0,
        lastSpinDate: null
        // Password not required due to schema change
      });
    }

    // Create Session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);
    await Session.create({
      token: sessionToken,
      user: user._id,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    attachSessionCookie(res, sessionToken);

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        rewards: user.rewards,
        spinsAvailable: user.spinsAvailable,
      },
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  try {
    if (req.token) {
      await Session.deleteOne({ token: req.token });
    }
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        rewards: user.rewards,
        spinsAvailable: user.spinsAvailable,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Proxy route to fetch Google User Info (avoids CORS/Network issues on client)
router.post('/google-info', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Google Proxy Error:', error.message);
    res.status(500).json({ message: 'Failed to fetch Google profile' });
  }
});

import sendSMS from '../utils/sendSMS.js';

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    let { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    // Ensure E.164 format (default to India +91 if missing)
    if (!mobile.startsWith('+')) {
      mobile = `+91${mobile}`;
    }

    let user = await User.findOne({ phone: mobile });

    if (!user) {
      // Auto-register new user with placeholder details
      // This allows "new user logging in with mobile" flow
      user = await User.create({
        name: `User ${mobile.slice(-4)}`,
        email: `${mobile}@mobile.temp`, // Placeholder email
        phone: mobile,
        // No password needed
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user
    user.loginOtp = otp;
    user.loginOtpExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // Send SMS
    const message = await sendSMS(mobile, `Your MetroClassy Login OTP is: ${otp}`);

    if (message) {
      res.json({ message: 'OTP sent successfully' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP' });
    }

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile and OTP are required' });
    }

    const user = await User.findOne({ phone: mobile });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.loginOtp || user.loginOtp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (user.loginOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    // Clear OTP
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;

    // If user was temp, maybe prompts to complete profile? (Handled on frontend if needed)

    await user.save();

    // Create Session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + cookieOptions.maxAge);
    await Session.create({
      token: sessionToken,
      user: user._id,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    attachSessionCookie(res, sessionToken);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        picture: user.picture,
      },
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

