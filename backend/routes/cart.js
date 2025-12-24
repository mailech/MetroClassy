import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const router = express.Router();

// Get current user's cart
router.get('/', requireAuth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('cart.product', 'name price image');
  res.json({ items: user.cart || [] });
});

// Replace cart with provided items (merge happens client-side before calling)
router.put('/', requireAuth, async (req, res) => {
  const { items = [] } = req.body;

  const normalized = [];
  for (const item of items) {
    if (!item.product && !item._id && !item.id) continue;
    const productId = item.product || item._id || item.id;
    // Optional: verify product exists to avoid stale entries
    const product = await Product.findById(productId).select('name price image');
    if (!product) continue;
    normalized.push({
      product: product._id,
      name: item.name || product.name,
      price: item.price || product.price,
      image: item.image || product.image,
      quantity: Math.max(1, Number(item.quantity) || 1),
      variant: item.variant || '',
      size: item.size || item.selectedSize || '',
      color: item.color || item.selectedColor || '',
    });
  }

  const user = await User.findById(req.user._id);
  user.cart = normalized;
  await user.save();

  res.json({ items: user.cart });
});

export default router;

