import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyAdminToken } from '@/lib/adminAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify admin token
    await verifyAdminToken(req, res, () => {});
    
    await connectDB();

    // Get query parameters
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search query
    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.mobile': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get total count
    const totalUsers = await User.countDocuments(searchQuery);

    // Get users with pagination
    const users = await User.find(searchQuery)
      .select('email profile createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get recent signups (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      users,
      totalUsers,
      recentSignups,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit))
    });

  } catch (error) {
    console.error('Admin users API error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
