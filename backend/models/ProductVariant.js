import mongoose from 'mongoose';

const productVariantSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    size: {
      type: String,
      trim: true,
    },
    color: {
      type: String,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      trim: true,
      sparse: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    price: {
      type: Number,
      min: 0,
    },
    imageUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
productVariantSchema.index({ product: 1, size: 1, color: 1 });

const ProductVariant = mongoose.model('ProductVariant', productVariantSchema);

export default ProductVariant;

