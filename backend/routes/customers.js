import express from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';

const router = express.Router();

// Get all customers with filters
router.get('/', async (req, res) => {
  try {
    const {
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isAdmin: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const customers = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Get order counts and total spent for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ user: customer._id });
        const totalOrders = orders.length;
        const totalSpent = orders
          .filter((o) => o.isPaid)
          .reduce((sum, o) => sum + o.totalPrice, 0);

        return {
          ...customer.toObject(),
          totalOrders,
          totalSpent,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      customers: customersWithStats,
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

// Get single customer with details
router.get('/:id', async (req, res) => {
  try {
    const customer = await User.findById(req.params.id).select('-password');
    if (!customer || customer.isAdmin) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const orders = await Order.find({ user: customer._id })
      .populate('orderItems.product', 'name image')
      .sort({ createdAt: -1 });

    const totalOrders = orders.length;
    const totalSpent = orders
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + o.totalPrice, 0);
    const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

    res.json({
      ...customer.toObject(),
      orders,
      stats: {
        totalOrders,
        totalSpent,
        avgOrderValue,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const customer = await User.findById(req.params.id);
    if (!customer || customer.isAdmin) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;

    await customer.save();
    const customerData = customer.toObject();
    delete customerData.password;

    res.json(customerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await User.findById(req.params.id);
    if (!customer || customer.isAdmin) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has orders
    const orderCount = await Order.countDocuments({ user: customer._id });
    if (orderCount > 0) {
      return res.status(400).json({
        message: `Cannot delete customer with ${orderCount} existing orders`,
      });
    }

    await customer.deleteOne();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

