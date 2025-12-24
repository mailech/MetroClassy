import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await connectDB();

    const email = process.argv[2] || 'admin@metroclassy.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || null; // Optional - will be collected during login

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`\n⚠️  User with email ${email} already exists`);
      if (existingAdmin.isAdmin) {
        // Update name if provided (optional)
        if (name && name.trim() !== '') {
          existingAdmin.name = name.trim();
          await existingAdmin.save();
          console.log(`✅ Updated admin name to: ${name}`);
        } else {
          if (existingAdmin.name && existingAdmin.name.trim() !== '') {
            console.log(`   Current name: ${existingAdmin.name}`);
          } else {
            console.log(`   ⚠️  No name set - will be collected during login`);
          }
        }
        // Update password if provided
        if (password && password !== 'admin123') {
          existingAdmin.password = await bcrypt.hash(password, 10);
          await existingAdmin.save();
          console.log(`✅ Updated admin password`);
        }
        console.log('✅ User is already an admin');
        process.exit(0);
      } else {
        // Update existing user to admin
        existingAdmin.isAdmin = true;
        if (name && name.trim() !== '') {
          existingAdmin.name = name.trim();
        }
        existingAdmin.password = await bcrypt.hash(password, 10);
        await existingAdmin.save();
        console.log(`✅ Updated user ${email} to admin`);
        if (name && name.trim() !== '') {
          console.log(`   Name: ${name}`);
        } else {
          console.log(`   ⚠️  Name will be collected during login`);
        }
        process.exit(0);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = new User({
      name: name && name.trim() !== '' ? name.trim() : undefined,
      email,
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    console.log('\n✅ Admin user created successfully!');
    console.log(`\n📋 Admin Details:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    if (name && name.trim() !== '') {
      console.log(`   Name: ${name} (will be updated during login)`);
    } else {
      console.log(`   Name: Will be collected during login`);
    }
    console.log(`\n⚠️  IMPORTANT:`);
    console.log(`   - Login at /admin/login with email and password`);
    console.log(`   - You will be asked to enter your name during login`);
    console.log(`   - The name you enter will be displayed in the header and recorded in audit logs`);

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();

