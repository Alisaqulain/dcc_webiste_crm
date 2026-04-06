import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
  } catch {
    throw new Error('Invalid token');
  }
};

/**
 * Users grouped by direct referrer (who signed up under whom).
 */
export async function GET(request) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const groups = await User.aggregate([
      { $match: { referredBy: { $ne: null } } },
      {
        $lookup: {
          from: 'users',
          localField: 'referredBy',
          foreignField: '_id',
          as: 'referrerDoc',
        },
      },
      { $unwind: '$referrerDoc' },
      {
        $group: {
          _id: '$referredBy',
          referrerEmail: { $first: '$referrerDoc.email' },
          referrerFirstName: { $first: '$referrerDoc.profile.firstName' },
          referrerLastName: { $first: '$referrerDoc.profile.lastName' },
          referrerCode: { $first: '$referrerDoc.referralCode' },
          referrerEarnings: { $first: '$referrerDoc.referralEarnings' },
          referrerDirectCount: { $first: '$referrerDoc.referralCount' },
          referrals: {
            $push: {
              userId: '$_id',
              email: '$email',
              firstName: '$profile.firstName',
              lastName: '$profile.lastName',
              createdAt: '$createdAt',
              isActive: '$isActive',
              referralLocked: '$referralLocked',
            },
          },
          underCount: { $sum: 1 },
        },
      },
      { $sort: { underCount: -1, referrerEmail: 1 } },
    ]);

    const underByReferrer = groups.map((g) => {
      const refs = (g.referrals || []).sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      const refName = [g.referrerFirstName, g.referrerLastName].filter(Boolean).join(' ').trim();
      return {
        referrerId: String(g._id),
        referrer: {
          email: g.referrerEmail,
          name: refName || g.referrerEmail,
          referralCode: g.referrerCode || '',
          referralEarnings: g.referrerEarnings ?? 0,
          referralCount: g.referrerDirectCount ?? 0,
        },
        directCount: g.underCount,
        referrals: refs.map((r) => ({
          userId: r.userId ? String(r.userId) : '',
          email: r.email,
          name: [r.firstName, r.lastName].filter(Boolean).join(' ').trim() || r.email,
          joinedAt: r.createdAt,
          isActive: Boolean(r.isActive),
          referralLocked: Boolean(r.referralLocked),
        })),
      };
    });

    return Response.json({ underByReferrer });
  } catch (e) {
    console.error('Admin referrals network GET', e);
    return Response.json({ message: 'Failed to load referral network' }, { status: 500 });
  }
}
