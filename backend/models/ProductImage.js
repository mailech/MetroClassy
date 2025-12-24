import mongoose from 'mongoose';

const productImageSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    url: {
      type: String,
      required: true,
    },
    isMain: {
      type: Boolean,
      default: false,
    },
    altText: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one main image per product
productImageSchema.pre('save', async function (next) {
  if (this.isMain) {
    await mongoose.model('ProductImage').updateMany(
      { product: this.product, _id: { $ne: this._id } },
      { isMain: false }
    );
  }
  next();
});

productImageSchema.index({ product: 1, order: 1 });

const ProductImage = mongoose.model('ProductImage', productImageSchema);

export default ProductImage;

