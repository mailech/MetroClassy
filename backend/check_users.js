import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: './.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({}, 'name email phone createdAt').sort({ createdAt: -1 }).limit(10);
        console.log('Recent Users:');
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone || 'MISSING'}`);
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
