
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Coupon from '../models/Coupon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const coupons = [
    {
        code: 'METRO5',
        description: '5% off on your cart',
        discountType: 'percentage',
        discountValue: 5,
        minPurchase: 0,
        validFrom: new Date(),
        validUntil: new Date('2030-12-31'),
        isActive: true,
    },
    {
        code: 'METRO10',
        description: '10% off drop',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 0,
        validFrom: new Date(),
        validUntil: new Date('2030-12-31'),
        isActive: true,
    },
    {
        code: 'METRO15',
        description: '15% Signature Discount',
        discountType: 'percentage',
        discountValue: 15,
        minPurchase: 0,
        validFrom: new Date(),
        validUntil: new Date('2030-12-31'),
        isActive: true,
    },
    {
        code: 'SHIPFREE',
        description: 'Complimentary metro shipping',
        discountType: 'fixed', // Assuming fixed discount equal to shipping cost which is usually logic handled in backend or just high enough fixed value
        discountValue: 1000,   // High enough value? Or maybe we should improve backend logic for free shipping. For now assuming fixed discount of shipping cost (~149) or just a generous amount that covers it.
        // Actually the coupon validation logic (Step 454) only supports percentage or fixed value deduction.
        // It doesn't support a "FREE_SHIPPING" type flag natively yet.
        // Let's set it to fixed 149 (standard shipping cost) for now, or 0 and handle it specially?
        // The user screenshot shows shipping is 149.
        // Let's make it fixed 149 for now.
        discountValue: 149,
        minPurchase: 0,
        validFrom: new Date(),
        validUntil: new Date('2030-12-31'),
        isActive: true,
    },
    {
        code: 'EARLYPASS',
        description: 'Early Access Pass',
        discountType: 'fixed',
        discountValue: 0, // Symbolic ?
        minPurchase: 0,
        validFrom: new Date(),
        validUntil: new Date('2030-12-31'),
        isActive: true,
    },
    // Lucky Draw needs manual handling? The coupon code EARLYPASS probably doesn't do a discount, but is a token?
    // User wants "discount" so let's skip EARLYPASS as a discount coupon for now or confirm what it does.
    // Actually, let's just make sure it exists so it doesn't error "Invalid Coupon".
];

const seedCoupons = async () => {
    await connectDB();

    for (const couponData of coupons) {
        const exists = await Coupon.findOne({ code: couponData.code });
        if (!exists) {
            await Coupon.create(couponData);
            console.log(`Created coupon: ${couponData.code}`);
        } else {
            console.log(`Coupon already exists: ${couponData.code}`);
        }
    }

    console.log('Coupons seeded successfully');
    process.exit();
};

seedCoupons();
