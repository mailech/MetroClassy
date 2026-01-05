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
  try {
    const { items = [] } = req.body;

    const normalized = [];
    for (const item of items) {
      if (!item.product && !item._id && !item.id) continue;
      const productId = item.product || item._id || item.id;

      // Optional: verify product exists to avoid stale entries
      // We can iterate efficiently or just fetch basic details. 
      // For performance in loops, `find` with `$in` is better but here we process item logic 1-by-1 to map fields.
      // Let's assume frontend sends valid IDs or we check quickly.
      // To strictly avoid stale image variants, fetching fresh product is good.
      const product = await Product.findById(productId).select('name price image');
      if (!product) continue;

      normalized.push({
        product: product._id,
        name: item.name || product.name,
        price: item.price || product.price,
        image: product.image, // Always use fresh image from product DB
        quantity: Math.max(1, Number(item.quantity) || 1),
        variant: item.variant || '',
        size: item.size || item.selectedSize || '',
        color: item.color || item.selectedColor || '',
      });
    }

    // Use atomic update to avoid VersionError (concurrent requests)
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { cart: normalized } },
      { new: true } // Return updated doc
    ).populate('cart.product', 'name price image');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ items: user.cart });
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

