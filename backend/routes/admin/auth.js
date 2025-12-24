import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../../models/User.js';
import Session from '../../models/Session.js';
import { generateToken, requireAuth } from '../../middleware/auth.js';
import { adminLoginLimiter } from '../../middleware/rateLimiter.js';
import { logAdminAction } from '../../middleware/auditLog.js';
import crypto from 'crypto';

const router = express.Router();

// Admin login
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Name is required. Please enter your name.' });
    }

    // Get real IP address for logging
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.connection?.remoteAddress ||
                      req.socket?.remoteAddress ||
                      req.ip ||
                      'Unknown';

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Log failed login attempt (user not found)
      await logAdminAction(
        null, // No user ID for failed attempts
        'LOGIN_FAILED',
        'USER',
        null,
        {
          email: email.toLowerCase(),
          reason: 'User not found',
          attemptTime: new Date().toISOString(),
        },
        req
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    if (!user.isAdmin) {
      // Log failed login attempt (not admin)
      await logAdminAction(
        user._id,
        'LOGIN_FAILED',
        'USER',
        user._id,
        {
          email: user.email,
          name: user.name || 'Unknown',
          reason: 'Not an admin user',
          attemptTime: new Date().toISOString(),
        },
        req
      );
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Log failed login attempt (wrong password)
      await logAdminAction(
        user._id,
        'LOGIN_FAILED',
        'USER',
        user._id,
        {
          email: user.email,
          name: user.name,
          reason: 'Invalid password',
          attemptTime: new Date().toISOString(),
        },
        req
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update name with the value provided at login so subsequent actions use the current admin name
    // and update last login time.
    user.name = name.trim();
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await Session.create({
      token: sessionToken,
      user: user._id,
      expiresAt,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    });

    // Log successful admin login with enhanced tracking
    await logAdminAction(user._id, 'LOGIN', 'USER', user._id, {
      email: user.email,
      name: user.name,
      loginTime: new Date().toISOString(),
      sessionToken: sessionToken.substring(0, 8) + '...', // Partial token for reference
      lastLogin: user.lastLogin?.toISOString() || null,
    }, req);

    // Set cookie (HttpOnly, Secure in production)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('token', sessionToken, cookieOptions);

    // Return the updated name
    const userName = user.name && user.name.trim() !== '' ? user.name.trim() : name.trim();
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: userName, // Use name from login request
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin logout
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Delete session
    if (req.token) {
      await Session.deleteOne({ token: req.token });
    }

    // Log logout with IP tracking
    if (req.user && req.user.isAdmin) {
      await logAdminAction(req.user._id, 'LOGOUT', 'USER', req.user._id, {
        email: req.user.email,
        name: req.user.name,
        logoutTime: new Date().toISOString(),
      }, req);
    }

    // Clear cookie
    res.clearCookie('token');

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current admin user
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Ensure name is always present
    const userName = req.user.name && req.user.name.trim() !== '' ? req.user.name.trim() : 'Admin User';
    
    res.json({
      user: {
        id: req.user._id,
        name: userName,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        lastLogin: req.user.lastLogin,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

