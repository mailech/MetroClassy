import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// sessionSchema.index({ token: 1 }); // Removed to avoid duplicate index error
sessionSchema.index({ user: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;

