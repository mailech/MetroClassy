import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () { return !this.googleId; }, // Password required only if valid googleId is not present
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    picture: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
    },
    loginOtp: {
      type: String,
    },
    loginOtpExpires: {
      type: Date,
    },
    savedAddresses: [
      {
        name: {
          type: String,
          required: true,
        },
        phone: {
          type: String,
          required: true,
        },
        street: {
          type: String,
          required: true,
        },
        city: {
          type: String,
          required: true,
        },
        state: {
          type: String,
          required: true,
        },
        zip: {
          type: String,
          required: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
    },
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number,
        image: String,
        quantity: { type: Number, default: 1 },
        variant: String,
        size: String,
        color: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;

