import connectDB from '../lib/mongodb.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

const seedAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Admin@786786', saltRounds);

    // Create admin account
    const admin = new Admin({
      email: 'admin@gmail.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin account created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: Admin@786786');
    console.log('Role: super_admin');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
