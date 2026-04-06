import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

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
 * Users who have at least one learner-profile coupon (createdBy=user, owner set).
 */
export async function GET(request) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const rows = await Coupon.aggregate([
      {
        $match: {
          createdBy: 'user',
          ownerId: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$ownerId',
          couponCount: { $sum: 1 },
          totalUses: { $sum: '$usedCount' },
          couponsWithUse: {
            $sum: { $cond: [{ $gt: ['$usedCount', 0] }, 1, 0] },
          },
          activeCoupons: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'u',
        },
      },
      {
        $unwind: { path: '$u', preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: { $ifNull: ['$u.email', ''] },
          firstName: { $ifNull: ['$u.profile.firstName', ''] },
          lastName: { $ifNull: ['$u.profile.lastName', ''] },
          couponCount: 1,
          totalUses: 1,
          couponsWithUse: 1,
          activeCoupons: 1,
          missingUser: { $eq: ['$u', null] },
        },
      },
      { $sort: { lastName: 1, firstName: 1, email: 1 } },
    ]);

    const learners = rows.map((r) => {
      const name = [r.firstName, r.lastName].filter(Boolean).join(' ').trim();
      return {
        userId: r.userId ? String(r.userId) : null,
        email: r.email || (r.missingUser ? '(account missing)' : ''),
        name: name || r.email || 'Unknown',
        couponCount: r.couponCount,
        totalUses: r.totalUses,
        couponsWithUse: r.couponsWithUse,
        hasAnyRedemption: r.couponsWithUse > 0,
        activeCoupons: r.activeCoupons,
        missingUser: Boolean(r.missingUser),
      };
    });

    return Response.json({ learners });
  } catch (e) {
    console.error('Admin coupons learners GET', e);
    return Response.json({ message: 'Failed to load learners' }, { status: 500 });
  }
}
