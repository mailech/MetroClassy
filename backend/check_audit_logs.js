import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from './models/AuditLog.js';

dotenv.config({ path: './.env' });

const checkLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const count = await AuditLog.countDocuments();
        console.log(`Total Audit Logs: ${count}`);

        if (count > 0) {
            const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(3);
            console.log('Sample Logs:', JSON.stringify(logs, null, 2));
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkLogs();
