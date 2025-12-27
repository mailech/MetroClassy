import express from 'express';
import Product from '../../models/Product.js';
import ProductVariant from '../../models/ProductVariant.js';
import ProductImage from '../../models/ProductImage.js';
import { adminAuth } from '../../middleware/auth.js';
import { auditLog } from '../../middleware/auditLog.js';
import { upload, getFileUrl } from '../../utils/fileUpload.js';
import { strictLimiter } from '../../middleware/rateLimiter.js';

const router = express.Router();

// Apply admin auth to all routes
router.use(adminAuth);

// Get all products (with pagination, search, filters)
router.get('/', auditLog('VIEW', 'PRODUCT'), async (req, res) => {
  try {
    const {
      search,
      category,
      isActive,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined && isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('categoryRef', 'name slug');

    const total = await Product.countDocuments(query);

    res.json({
      products,
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

// Get single product with variants and images
router.get('/:id', auditLog('VIEW', 'PRODUCT'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categoryRef');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const variants = await ProductVariant.find({ product: product._id });
    const images = await ProductImage.find({ product: product._id }).sort({ order: 1, isMain: -1 });

    res.json({
      product,
      variants,
      images,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to sanitize product data
const sanitizeProductData = (data) => {
  const sanitized = { ...data };

  // Convert empty string gender to null
  if (sanitized.gender === '' || sanitized.gender === null || sanitized.gender === undefined) {
    sanitized.gender = null;
  }

  // Convert empty string discountPrice to null
  if (sanitized.discountPrice === '') {
    sanitized.discountPrice = null;
  }

  // Remove empty strings for optional fields
  if (sanitized.brand === '') sanitized.brand = undefined;
  if (sanitized.sku === '') sanitized.sku = undefined;

  return sanitized;
};

// Helper function to format validation errors for users
const formatValidationError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors);
    const firstError = errors[0];

    // Simple, user-friendly error messages
    if (firstError.path === 'name') {
      return 'Please enter a product name';
    }
    if (firstError.path === 'price') {
      return 'Please enter a valid price (must be 0 or greater)';
    }
    if (firstError.path === 'description') {
      return 'Please enter a product description';
    }
    if (firstError.path === 'image') {
      return 'Please provide a product image (URL or upload)';
    }
    if (firstError.path === 'category') {
      return 'Please select a valid category';
    }
    if (firstError.path === 'countInStock') {
      return 'Please enter stock quantity (must be 0 or greater)';
    }
    if (firstError.path === 'gender') {
      return 'Gender must be one of: Men, Women, or Unisex. Leave empty for non-clothing items.';
    }

    // Generic validation error
    return `Invalid ${firstError.path}: ${firstError.message}`;
  }

  return error.message || 'Something went wrong. Please check your input and try again.';
};

// Create product
router.post(
  '/',
  strictLimiter,
  auditLog('CREATE', 'PRODUCT'),
  async (req, res) => {
    try {
      const productData = sanitizeProductData(req.body);

      // If a categoryRef (category ObjectId) is provided, ensure category string is set from slug/name
      if (productData.categoryRef && !productData.category) {
        const Category = (await import('../../models/Category.js')).default;
        const cat = await Category.findById(productData.categoryRef);
        if (cat) {
          productData.category = (cat.slug || cat.name || '').toLowerCase();
        }
      }

      const product = new Product(productData);
      await product.save();

      res.status(201).json(product);
    } catch (error) {
      const userFriendlyMessage = formatValidationError(error);
      res.status(400).json({ message: userFriendlyMessage });
    }
  }
);

// Update product
router.put(
  '/:id',
  strictLimiter,
  auditLog('UPDATE', 'PRODUCT'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Sanitize update data
      const updateData = sanitizeProductData(req.body);

      // If a categoryRef (category ObjectId) is provided, ensure category string is set from slug/name
      if (updateData.categoryRef && !updateData.category) {
        const Category = (await import('../../models/Category.js')).default;
        const cat = await Category.findById(updateData.categoryRef);
        if (cat) {
          updateData.category = (cat.slug || cat.name || '').toLowerCase();
        }
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          product[key] = updateData[key];
        }
      });

      await product.save();
      res.json(product);
    } catch (error) {
      const userFriendlyMessage = formatValidationError(error);
      res.status(400).json({ message: userFriendlyMessage });
    }
  }
);

// Delete product
router.delete(
  '/:id',
  strictLimiter,
  auditLog('DELETE', 'PRODUCT'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete related variants and images
      await ProductVariant.deleteMany({ product: product._id });
      await ProductImage.deleteMany({ product: product._id });

      await product.deleteOne();
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add variant to product
router.post(
  '/:id/variants',
  strictLimiter,
  auditLog('CREATE', 'VARIANT'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      const variantData = {
        ...req.body,
        product: product._id,
      };

      const variant = new ProductVariant(variantData);
      await variant.save();

      res.status(201).json(variant);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Update variant
router.put(
  '/variants/:variantId',
  strictLimiter,
  auditLog('UPDATE', 'VARIANT'),
  async (req, res) => {
    try {
      const variant = await ProductVariant.findById(req.params.variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }

      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) {
          variant[key] = req.body[key];
        }
      });

      await variant.save();
      res.json(variant);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete variant
router.delete(
  '/variants/:variantId',
  strictLimiter,
  auditLog('DELETE', 'VARIANT'),
  async (req, res) => {
    try {
      const variant = await ProductVariant.findById(req.params.variantId);
      if (!variant) {
        return res.status(404).json({ message: 'Variant not found' });
      }

      await variant.deleteOne();
      res.json({ message: 'Variant deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Upload product images
router.post(
  '/:id/images',
  strictLimiter,
  upload.array('images', 10),
  auditLog('UPLOAD', 'IMAGE'),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No images uploaded' });
      }

      const images = req.files.map((file, index) => ({
        product: product._id,
        // vital: for Cloudinary, file.path is the full secure URL. Prefer it.
        url: (file.path && file.path.startsWith('http')) ? file.path : getFileUrl(file.filename),
        isMain: index === 0 && !req.body.isMain, // First image is main by default
        altText: req.body.altText || product.name,
        order: index,
      }));

      const createdImages = await ProductImage.insertMany(images);

      res.status(201).json({ images: createdImages });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Delete product image
router.delete(
  '/images/:imageId',
  strictLimiter,
  auditLog('DELETE', 'IMAGE'),
  async (req, res) => {
    try {
      const image = await ProductImage.findById(req.params.imageId);
      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      await image.deleteOne();
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

export default router;

