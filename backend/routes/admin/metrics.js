import express from 'express';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import { adminAuth } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/auditLog.js';

const router = express.Router();

router.use(adminAuth);

// Get dashboard metrics
router.get('/dashboard', auditLog('VIEW', 'USER'), async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      activeProducts,
      productsByCategory,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ isAdmin: false }),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({ countInStock: { $lt: 10 } }),
      Product.countDocuments({ isActive: true }),
      Product.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$category', 'uncategorized'] },
            count: { $sum: 1 },
            totalStock: { $sum: { $ifNull: ['$countInStock', 0] } },
          },
        },
        { $sort: { totalStock: -1, count: -1 } },
      ]),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    // Recent orders
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('totalPrice status createdAt user');

    // Top selling products
    const topProducts = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $project: {
          productId: '$_id',
          productName: '$product.name',
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({
      overview: {
        totalProducts,
        activeProducts,
        totalOrders,
        totalUsers,
        totalRevenue: revenue,
        pendingOrders,
        lowStockProducts,
      },
      productsByCategory,
      recentOrders,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get low stock items
router.get('/low-stock', auditLog('VIEW', 'PRODUCT'), async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    const lowStockProducts = await Product.find({
      countInStock: { $lt: parseInt(threshold) },
      isActive: true,
    })
      .select('name sku countInStock price category')
      .sort({ countInStock: 1 });

    const lowStockVariants = await ProductVariant.find({
      stock: { $lt: parseInt(threshold) },
      isActive: true,
    })
      .populate('product', 'name sku')
      .select('size color stock sku product')
      .sort({ stock: 1 });

    res.json({
      products: lowStockProducts,
      variants: lowStockVariants,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue analytics
router.get('/revenue', auditLog('VIEW', 'ORDER'), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const revenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(revenue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

