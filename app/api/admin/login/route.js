import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ 
        message: 'Email and password are required' 
      }, { status: 400 });
    }

    // Find admin by email
    const admin = await Admin.findOne({ 
      email: email.toLowerCase(),
      isActive: true 
    });

    if (!admin) {
      return Response.json({ 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return Response.json({ 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Create JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
        name: admin.name
      },
      process.env.NEXTAUTH_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return Response.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return Response.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}
