import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import User from '@/models/User';

function couponStatus(c) {
  const now = new Date();
  if (c.isLocked) return 'locked';
  if (c.expiresAt && new Date(c.expiresAt) < now) return 'expired';
  const limit = Number(c.usageLimit) || 0;
  if (limit > 0 && (c.usedCount || 0) >= limit) return 'used';
  if (!c.isActive) return 'inactive';
  return 'active';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const emailNorm = String(session.user.email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm })
      .select('_id courses')
      .lean();
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    let defaultCheckoutCourseId = null;
    if (user.courses?.length) {
      const sorted = [...user.courses].sort(
        (a, b) => new Date(b.purchasedAt || 0) - new Date(a.purchasedAt || 0)
      );
      const cid = sorted[0]?.courseId;
      defaultCheckoutCourseId = cid ? String(cid) : null;
    }

    const coupons = await Coupon.find({ ownerId: user._id })
      .populate('courseId', 'title thumbnail price')
      .sort({ createdAt: -1 })
      .lean();

    const list = coupons.map((c) => {
      const cid = c.courseId?._id || c.courseId || null;
      const checkoutCourseId = cid || defaultCheckoutCourseId;
      const sharePath = checkoutCourseId
        ? `/purchase/${checkoutCourseId}?coupon=${encodeURIComponent(c.code)}`
        : `/courses?coupon=${encodeURIComponent(c.code)}`;
      return {
        _id: c._id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
        courseId: cid,
        courseTitle: c.courseId?.title || 'Any course',
        courseThumbnail: c.courseId?.thumbnail,
        coursePrice: c.courseId?.price,
        appliesAllCourses: !cid,
        expiresAt: c.expiresAt,
        usageLimit: c.usageLimit,
        usedCount: c.usedCount,
        isActive: c.isActive,
        isLocked: c.isLocked,
        isShareable: c.isShareable,
        createdBy: c.createdBy,
        status: couponStatus(c),
        sharePath,
      };
    });

    const byCourse = {};
    for (const row of list) {
      const key = row.courseId ? String(row.courseId) : '__any__';
      if (!byCourse[key]) {
        byCourse[key] = {
          courseId: row.courseId,
          courseTitle: row.courseTitle,
          coupons: [],
        };
      }
      byCourse[key].coupons.push(row);
    }

    return Response.json({
      coupons: list,
      grouped: Object.values(byCourse),
    });
  } catch (e) {
    console.error('User coupons GET error:', e);
    return Response.json({ message: 'Failed to load coupons' }, { status: 500 });
  }
}
