import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

import connectDB from './config/db.js';
import productRoutes from './routes/products.js';
import discountWheelRoutes from './routes/discountWheel.js';
import analyticsRoutes from './routes/analytics.js';
import orderRoutes from './routes/orders.js';
import customerRoutes from './routes/customers.js';
import couponRoutes from './routes/coupons.js';
import authRoutes from './routes/auth.js';
import cartRoutes from './routes/cart.js';
import userRoutes from './routes/users.js';
import paymentRoutes from './routes/payment.js';

// Admin routes
import adminAuthRoutes from './routes/admin/auth.js';
import adminProductRoutes from './routes/admin/products.js';
import adminCategoryRoutes from './routes/admin/categories.js';
import adminOrderRoutes from './routes/admin/orders.js';
import adminMetricsRoutes from './routes/admin/metrics.js';
import adminAuditLogRoutes from './routes/admin/auditLogs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for accurate IP addresses (important for production behind reverse proxy)
// Trust proxy config for rate limiting
app.set('trust proxy', false); // Set to false for local dev, or 1 if behind Nginx/Heroku

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',')
  : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite frontend (shop)
    'http://localhost:5174', // Vite admin (if run separately)
    'http://localhost:4173', // Vite preview
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in development
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Public Routes
app.use('/api/products', productRoutes);
app.use('/api/discount-wheel', discountWheelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payment', paymentRoutes);

// Admin Routes (protected)
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/metrics', adminMetricsRoutes);
app.use('/api/admin/audit-logs', adminAuditLogRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('MetroClassy API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;
