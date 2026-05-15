import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
import User from '@/models/User';
import '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email }).lean();

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const referrals = await Referral.find({ referrer: user._id })
      .populate('course', 'title price')
      .populate('referredUser', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .lean();

    const directSignups = await User.countDocuments({ referredBy: user._id });

    const pendingEarnings = referrals
      .filter((r) => r.status === 'pending')
      .reduce((s, r) => s + (r.amount || 0), 0);
    const approvedEarnings = referrals
      .filter((r) => r.status === 'approved' || r.status === 'paid')
      .reduce((s, r) => s + (r.amount || 0), 0);

    return Response.json({
      referrals,
      summary: {
        directSignups,
        pendingCount: referrals.filter((r) => r.status === 'pending').length,
        approvedCount: referrals.filter(
          (r) => r.status === 'approved' || r.status === 'paid'
        ).length,
        pendingEarnings,
        approvedEarnings,
        lifetimeCredited: user.referralEarnings || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return Response.json({ message: 'Failed to fetch referrals' }, { status: 500 });
  }
}
