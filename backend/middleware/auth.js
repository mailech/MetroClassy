import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

// Authentication middleware - verifies user is logged in
export const requireAuth = async (req, res, next) => {
  try {
    let token;

    // 1) Header-based JWT (used by admin app)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];

      const decoded = await verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      req.user = user;
      req.token = token;
      return next();
    }

    // 2) Cookie-based session (used by shopper app)
    const cookieToken = req.cookies && req.cookies.token;
    if (!cookieToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const session = await Session.findOne({ token: cookieToken }).populate('user', '-password');
    if (!session || !session.user) {
      return res.status(401).json({ message: 'Session expired' });
    }

    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: 'Session expired' });
    }

    req.user = session.user;
    req.token = cookieToken;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

// Admin role check middleware - must be used after requireAuth
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(403).json({ message: 'Admin authorization failed', error: error.message });
  }
};

// Combined admin middleware
export const adminAuth = [requireAuth, requireAdmin];
