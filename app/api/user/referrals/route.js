import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';
import '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get user by email to get the user ID
    const user = await User.findOne({ email: session.user.email }).lean();
    
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const referrals = await Referral.find({ referrer: user._id })
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return Response.json({ message: 'Failed to fetch referrals' }, { status: 500 });
  }
}


