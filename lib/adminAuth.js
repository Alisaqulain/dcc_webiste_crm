import jwt from 'jsonwebtoken';
import connectDB from './mongodb';
import Admin from '../models/Admin';

export const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    
    await connectDB();
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Invalid token or admin not found' });
    }

    req.admin = {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };
    
    next();
  } catch (error) {
    console.error('Admin token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
};
