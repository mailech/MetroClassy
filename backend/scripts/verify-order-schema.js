
import mongoose from 'mongoose';
import Order from '../models/Order.js';

const run = async () => {
    try {
        const orderItems = [{
            product: new mongoose.Types.ObjectId(),
            name: "Test Product",
            qty: 1,
            image: "test.jpg",
            price: 100,
            size: "M",
            color: "Red"
        }];

        // Validate using the schema
        const order = new Order({
            user: new mongoose.Types.ObjectId(),
            orderItems: orderItems,
            shippingAddress: {
                fullName: "Test User",
                phone: "1234567890",
                address: "123 St",
                city: "City",
                state: "State",
                postalCode: "123456",
                country: "India"
            },
            paymentMethod: "cod",
            itemsPrice: 100,
            taxPrice: 0,
            shippingPrice: 0,
            totalPrice: 100,
            isPaid: false
        });

        await order.validate();
        console.log("Validation Successful: Size and Color are accepted in Order Schema.");

    } catch (error) {
        console.error("Validation Failed:", error.message);
        process.exit(1);
    }
};

run();
