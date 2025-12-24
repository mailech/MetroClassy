import express from 'express';
import Category from '../../models/Category.js';
import { adminAuth } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/auditLog.js';
import { strictLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

router.use(adminAuth);

// Get all categories
router.get('/', auditLog('VIEW', 'CATEGORY'), async (req, res) => {
  try {
    const { parent, isActive } = req.query;

    const query = {};
    if (parent !== undefined) {
      query.parent = parent === 'null' ? null : parent;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .populate('parent', 'name slug')
      .sort({ order: 1, name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single category
router.get('/:id', auditLog('VIEW', 'CATEGORY'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create category
router.post(
  '/',
  strictLimiter,
  auditLog('CREATE', 'CATEGORY'),
  async (req, res) => {
    try {
      const { name, slug, ...rest } = req.body;

      // Generate slug if not provided
      const categorySlug =
        slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const category = new Category({
        name,
        slug: categorySlug,
        ...rest,
      });

      await category.save();
      res.status(201).json(category);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Category name or slug already exists' });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Update category
router.put(
  '/:id',
  strictLimiter,
  auditLog('UPDATE', 'CATEGORY'),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          category[key] = req.body[key];
        }
      });

      await category.save();
      res.json(category);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'Category name or slug already exists' });
      }
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete category
router.delete(
  '/:id',
  strictLimiter,
  auditLog('DELETE', 'CATEGORY'),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      // Check if category has subcategories
      const subcategories = await Category.countDocuments({ parent: category._id });
      if (subcategories > 0) {
        return res.status(400).json({
          message: 'Cannot delete category with subcategories',
        });
      }

      await category.deleteOne();
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

