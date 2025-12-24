import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    reward: { type: String, required: true },
    couponCode: { type: String, required: true },
    probability: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    color: {
      type: String,
      default: '#ffffff',
    },
    active: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: false, // Optional - if not set, discount applies to all categories
    },
  },
  { _id: false }
);

const discountWheelSchema = new mongoose.Schema(
  {
    segments: {
      type: [segmentSchema],
      validate: {
        validator: function (segments) {
          const total = segments.reduce(
            (sum, seg) => sum + (seg.active ? seg.probability : 0),
            0
          );
          return Math.abs(total - 1) < 0.0001;
        },
        message: 'Active segment probabilities must sum to 1',
      },
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
    usedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
  },
  { timestamps: true }
);

const DiscountWheel =
  mongoose.models.DiscountWheel ||
  mongoose.model('DiscountWheel', discountWheelSchema);

export default DiscountWheel;

