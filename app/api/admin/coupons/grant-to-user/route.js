import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import Course from '@/models/Course';
import {
  generateUniqueCouponCode,
  courseSlugPrefix,
} from '@/lib/couponService';

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
 * POST — create user-owned coupon(s) for a learner (shows in their profile).
 * Body: { userEmail, discountType, discountValue, count, courseId?: '__ALL__'|id, usageLimit?, expiresAt? }
 */
export async function POST(request) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      userEmail,
      discountType,
      discountValue,
      count: countRaw,
      courseId: courseIdRaw,
      usageLimit,
      expiresAt,
    } = body;

    const email = String(userEmail || '').toLowerCase().trim();
    if (!email) {
      return Response.json({ message: 'userEmail is required' }, { status: 400 });
    }

    const user = await User.findOne({ email }).select('_id');
    if (!user) {
      return Response.json({ message: 'No user with that email' }, { status: 404 });
    }

    if (discountType !== 'flat' && discountType !== 'percent') {
      return Response.json({ message: 'Invalid discountType' }, { status: 400 });
    }
    const dv = Number(discountValue);
    if (!Number.isFinite(dv) || dv < 0) {
      return Response.json({ message: 'Invalid discountValue' }, { status: 400 });
    }

    const n = Math.min(50, Math.max(1, parseInt(String(countRaw), 10) || 1));
    const limit =
      usageLimit === undefined || usageLimit === null
        ? 1
        : Math.max(0, parseInt(String(usageLimit), 10) || 0);
    const exp =
      expiresAt === null || expiresAt === ''
        ? null
        : expiresAt
          ? new Date(expiresAt)
          : null;

    const isGlobal =
      !courseIdRaw ||
      courseIdRaw === '__ALL__' ||
      String(courseIdRaw).trim() === '';

    let resolvedCourseId = null;
    let slug = 'ALL';
    if (!isGlobal) {
      const course = await Course.findById(courseIdRaw).select('title');
      if (!course) {
        return Response.json({ message: 'Course not found' }, { status: 404 });
      }
      resolvedCourseId = course._id;
      slug = courseSlugPrefix(course.title, 6);
    }

    const valPart =
      discountType === 'flat' ? `F${Math.round(dv)}` : `P${Math.round(dv)}`;
    const prefixBase = `GIFT${slug}${valPart}U${String(user._id).slice(-4)}`;

    const created = [];
    for (let i = 0; i < n; i++) {
      const code = await generateUniqueCouponCode(Coupon, prefixBase);
      const baseFields = {
        code,
        discountType,
        discountValue: dv,
        createdBy: 'user',
        ownerId: user._id,
        usageLimit: limit,
        usedCount: 0,
        expiresAt: exp,
        isActive: true,
        isLocked: false,
      };
      if (resolvedCourseId) {
        baseFields.courseId = resolvedCourseId;
      }
      const doc = await Coupon.create(baseFields);
      created.push(doc);
    }

    return Response.json({
      ok: true,
      count: created.length,
      coupons: created.map((c) => ({
        _id: c._id,
        code: c.code,
      })),
    });
  } catch (e) {
    console.error('Admin grant-to-user coupons', e);
    return Response.json(
      { message: e.message || 'Grant failed' },
      { status: 500 }
    );
  }
}
