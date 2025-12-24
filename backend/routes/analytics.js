import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.aggregate([
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Product.countDocuments({ countInStock: { $lt: 10 } }),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('totalPrice status createdAt user'),
      Order.aggregate([
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
      ]),
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    // Sales over time (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const salesOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isPaid: true,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Category distribution
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$countInStock'] } },
        },
      },
    ]);

    // Order status distribution
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      overview: {
        totalProducts,
        totalOrders,
        totalUsers,
        totalRevenue: revenue,
        pendingOrders,
        lowStockProducts,
      },
      recentOrders,
      topProducts,
      salesOverTime,
      categoryStats,
      orderStatusStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get revenue analytics
router.get('/revenue', async (req, res) => {
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
      default:
        startDate.setDate(startDate.getDate() - 7);
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

// Get product analytics
router.get('/products', async (req, res) => {
  try {
    const topSelling = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 20 },
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
          productImage: '$product.image',
          category: '$product.category',
          totalSold: 1,
          revenue: 1,
        },
      },
    ]);

    const categoryPerformance = await Order.aggregate([
      { $unwind: '$orderItems' },
      {
        $lookup: {
          from: 'products',
          localField: 'orderItems.product',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      {
        $group: {
          _id: '$product.category',
          totalSold: { $sum: '$orderItems.qty' },
          revenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      topSelling,
      categoryPerformance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

