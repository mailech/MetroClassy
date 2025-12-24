import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: null,
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  categoryRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  brand: {
    type: String,
    trim: true,
  },
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex', null],
    default: null,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  countInStock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  sizes: [{
    type: String,
    trim: true
  }],
  colors: [{
    name: { type: String, trim: true },
    class: { type: String, default: 'bg-gray-500' }, // Tailwind class or hex code
    selectedClass: { type: String }, // Optional: border ring color
    image: { type: String }, // URL of the image associated with this color
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate slug from name before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// productSchema.index({ slug: 1 }); // Removed to avoid duplicate index error
productSchema.index({ category: 1 });
productSchema.index({ categoryRef: 1 });
productSchema.index({ isActive: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
