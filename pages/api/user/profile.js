import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email })
      .populate('courses.courseId', 'name price')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format the response
    const userData = {
      id: user._id,
      email: user.email,
      profile: user.profile,
      referralCode: user.referralCode,
      referralEarnings: user.referralEarnings || 0,
      referralCount: user.referralCount || 0,
      referral: {
        code: user.referralCode,
        totalEarnings: user.referralEarnings || 0,
        pendingEarnings: 0 // You can calculate this based on pending referral status if needed
      },
      courses: user.courses.map(course => ({
        courseId: course.courseId,
        courseName: course.courseId?.name || 'Unknown Course',
        purchasedAt: course.purchasedAt,
        status: course.status,
        progress: course.progress
      })),
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };

    res.status(200).json(userData);

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}


