import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        comment: {
            type: String,
            required: true,
        },
        media: [
            {
                type: String, // URLs to uploaded images/videos
            },
        ],
        helpful: {
            type: Number,
            default: 0,
        },
        verified: {
            type: Boolean,
            default: false, // Set to true if user purchased the product
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
