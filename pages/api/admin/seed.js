import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@786786';
    const adminName = process.env.ADMIN_NAME || 'Super Admin';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      return res.status(200).json({
        message: 'Admin account already exists',
        admin: {
          email: adminEmail,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      });
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

    res.status(201).json({
      message: 'Admin account created successfully!',
      admin: {
        email: 'admin@gmail.com',
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Error seeding admin:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
