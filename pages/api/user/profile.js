import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

async function getReferralChainUp(userLean) {
  const chain = [];
  let refId = userLean.referredBy;
  for (let i = 0; i < 3 && refId; i++) {
    const p = await User.findById(refId)
      .select('email profile.firstName profile.lastName referralCode referredBy')
      .lean();
    if (!p) break;
    chain.push({
      email: p.email,
      name: `${p.profile?.firstName || ''} ${p.profile?.lastName || ''}`.trim(),
      referralCode: p.referralCode,
      level: i + 1,
    });
    refId = p.referredBy;
  }
  return chain;
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await connectDB();

    if (req.method === 'GET') {
      const user = await User.findOne({ email: session.user.email })
        .populate('courses.courseId', 'name title price')
        .lean();

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const referralChain = await getReferralChainUp(user);

      const userData = {
        id: user._id,
        email: user.email,
        profile: user.profile,
        referralCode: user.referralCode,
        referralLocked: user.referralLocked,
        referredBy: user.referredBy,
        isActive: user.isActive !== false,
        referralEarnings: user.referralEarnings || 0,
        referralCount: user.referralCount || 0,
        referralChain,
        referral: {
          code: user.referralCode,
          totalEarnings: user.referralEarnings || 0,
          pendingEarnings: 0,
        },
        courses: user.courses.map((course) => ({
          courseId: course.courseId,
          courseName:
            course.courseId?.title ||
            course.courseId?.name ||
            'Unknown Course',
          purchasedAt: course.purchasedAt,
          status: course.status,
          progress: course.progress,
        })),
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      };

      return res.status(200).json(userData);
    }

    if (req.method === 'PUT') {
      if (
        req.body.referredBy != null ||
        req.body.referralCode != null ||
        req.body.referralLocked != null
      ) {
        return res.status(400).json({ message: 'Referral fields cannot be changed' });
      }

      const { profile } = req.body;

      if (!profile) {
        return res.status(400).json({ message: 'Profile data is required' });
      }

      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (profile.firstName !== undefined) {
        user.profile.firstName = profile.firstName;
      }
      if (profile.lastName !== undefined) {
        user.profile.lastName = profile.lastName;
      }
      if (profile.mobile !== undefined) {
        user.profile.mobile = profile.mobile;
      }
      if (profile.state !== undefined) {
        user.profile.state = profile.state;
      }
      if (profile.avatar !== undefined) {
        user.profile.avatar = profile.avatar;
      }

      await user.save();

      return res.status(200).json({
        message: 'Profile updated successfully',
        profile: user.profile,
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}
