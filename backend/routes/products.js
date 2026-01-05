import express from 'express';
import Product from '../models/Product.js';
import { upload, getFileUrl } from '../utils/fileUpload.js';
const router = express.Router();

// Get all products with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      lowStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      isActive, // Add isActive param
    } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      query.countInStock = { $gt: 0 };
    } else if (inStock === 'false') {
      query.countInStock = 0;
    }

    if (lowStock === 'true') {
      query.countInStock = { $lt: 10, $gt: 0 };
    }

    // Debug logging
    console.log('GET /api/products Params:', { isActive, page, limit });

    // Filter by Active Status
    // Default to active only (for public frontend safety)
    // Admin can request 'all', 'true', or 'false'
    if (isActive === 'all') {
      // No filter - show everything
    } else if (isActive === 'false') {
      query.isActive = false;
    } else {
      // Default: show active only (including if isActive='true' or undefined)
      query.isActive = true;
    }

    console.log('Final MongoDB Query:', query);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Enrich products with valid images from ProductImage collection
    // This fixes the issue where the main 'image' field might be old/broken but 'ProductImage' has valid uploads
    let ProductImage;
    try {
      const module = await import('../models/ProductImage.js');
      ProductImage = module.default;
      console.log('Successfully loaded ProductImage model');
    } catch (importErr) {
      console.error('Failed to load ProductImage model:', importErr);
      // Continue without extra images
    }

    products = await Promise.all(products.map(async (p) => {
      let validImage = null;
      if (ProductImage) {
        try {
          validImage = await ProductImage.findOne({ product: p._id }).sort({ order: 1 });
        } catch (dbErr) {
          console.error('Error fetching ProductImage for product', p._id, dbErr);
        }
      }

      if (validImage) {
        // If we found a valid image in the separate collection, assume it's the good one
        // Return it as the main image AND in the images array
        return {
          ...p,
          image: validImage.url,
          images: [validImage.url]
        };
      }
      return {
        ...p,
        images: [p.image] // Fallback
      };
    }));

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

// Get single product
router.get('/:id', getProduct, async (req, res) => {
  try {
    // Fetch additional images from ProductImage collection
    const ProductImage = (await import('../models/ProductImage.js')).default;
    const images = await ProductImage.find({ product: res.product._id }).sort({ order: 1 });

    // Combine main image with additional images
    const productData = res.product.toObject();

    // If we have additional images, map them. 
    // Also include the main image from the product model if it's not already in the images list (deduplication logic might be needed but simple merge is safer for now)
    // Frontend expects `product.images` to be an array of URL strings.
    if (images.length > 0) {
      productData.images = images.map(img => img.url);
    } else {
      // Fallback: if no extra images, ensure main image is in the array so gallery works
      productData.images = [res.product.image];
    }

    res.json(productData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product
router.post('/', async (req, res) => {
  const product = new Product({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    image: req.body.image,
    category: req.body.category,
    countInStock: req.body.countInStock,
    sizes: req.body.sizes,
    colors: req.body.colors,
  });

  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', getProduct, async (req, res) => {
  try {
    if (req.body.name != null) res.product.name = req.body.name;
    if (req.body.price != null) res.product.price = req.body.price;
    if (req.body.description != null) res.product.description = req.body.description;
    if (req.body.image != null) res.product.image = req.body.image;
    if (req.body.category != null) res.product.category = req.body.category;
    if (req.body.countInStock != null) res.product.countInStock = req.body.countInStock;
    if (req.body.rating != null) res.product.rating = req.body.rating;
    if (req.body.numReviews != null) res.product.numReviews = req.body.numReviews;
    if (req.body.sizes != null) res.product.sizes = req.body.sizes;
    if (req.body.colors != null) res.product.colors = req.body.colors;

    const updatedProduct = await res.product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', getProduct, async (req, res) => {
  try {
    await res.product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Middleware to get product by ID
async function getProduct(req, res, next) {
  let product;
  try {
    product = await Product.findById(req.params.id);
    if (product == null) {
      return res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  res.product = product;
  next();
}

// ============ REVIEW ROUTES ============

// Get all reviews for a product
router.get('/:id/reviews', async (req, res) => {
  try {
    const Review = (await import('../models/Review.js')).default;
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name picture')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a review for a product
router.post('/:id/reviews', upload.array('media', 5), async (req, res) => {
  try {
    const Review = (await import('../models/Review.js')).default;
    const { requireAuth } = await import('../middleware/auth.js');

    // Check authentication
    await new Promise((resolve, reject) => {
      requireAuth(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const { rating, title, comment } = req.body;

    if (!rating || !title || !comment) {
      return res.status(400).json({ message: 'Please provide rating, title, and comment' });
    }

    // Check if user already reviewed this product - DISABLED per user request
    /*
    const existingReview = await Review.findOne({
      product: req.params.id,
      user: req.user._id,
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }
    */

    // Process uploaded media
    let mediaUrls = req.body.media || [];
    if (typeof mediaUrls === 'string') mediaUrls = [mediaUrls]; // Handle single string if any

    if (req.files && req.files.length > 0) {
      // With Cloudinary storage, file.path is the FULL URL
      const uploadedUrls = req.files.map(file => file.path);
      mediaUrls = [...(Array.isArray(mediaUrls) ? mediaUrls : []), ...uploadedUrls];
    }

    // Create review
    const review = new Review({
      product: req.params.id,
      user: req.user._id,
      rating: Number(rating),
      title,
      comment,
      media: mediaUrls,
    });

    await review.save();

    // Update product rating and review count
    const product = await Product.findById(req.params.id);
    const allReviews = await Review.find({ product: req.params.id });

    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = totalRating / allReviews.length;
    product.numReviews = allReviews.length;

    await product.save();

    res.status(201).json({
      message: 'Review submitted successfully',
      review: await review.populate('user', 'name picture')
    });
  } catch (error) {
    if (error.message === 'Not authenticated') {
      return res.status(401).json({ message: 'Please login to submit a review' });
    }
    res.status(500).json({ message: error.message });
  }
});

export default router;
