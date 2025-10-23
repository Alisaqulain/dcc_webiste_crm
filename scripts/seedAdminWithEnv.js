import connectDB from '../lib/mongodb.js';
import Admin from '../models/Admin.js';
import bcrypt from 'bcryptjs';

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

const seedAdmin = async () => {
  try {
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Not set');
    await connectDB();
    console.log('Connected to MongoDB');

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@786786';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Admin account already exists');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin account
    const admin = new Admin({
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'super_admin',
      isActive: true
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('👑 Role: super_admin');
    console.log('');
    console.log('You can now login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
