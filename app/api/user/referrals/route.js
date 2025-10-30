import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
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

    const referrals = await Referral.find({ referrer: session.user.id })
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ referrals });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return Response.json({ message: 'Failed to fetch referrals' }, { status: 500 });
  }
}


