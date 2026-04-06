import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
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

export async function GET(request) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const createdBy = searchParams.get('createdBy');
    const active = searchParams.get('active');
    const locked = searchParams.get('locked');
    const now = new Date();

    const q = {};
    if (courseId) q.courseId = courseId;
    if (createdBy === 'admin' || createdBy === 'user') q.createdBy = createdBy;
    if (active === 'true') q.isActive = true;
    if (active === 'false') q.isActive = false;
    if (locked === 'true') q.isLocked = true;
    if (locked === 'false') q.isLocked = false;
    if (searchParams.get('expired') === 'true') {
      q.expiresAt = { $lt: now };
    }
    if (searchParams.get('expired') === 'false') {
      q.$or = [{ expiresAt: null }, { expiresAt: { $gte: now } }];
    }

    const coupons = await Coupon.find(q)
      .populate('courseId', 'title price')
      .populate('ownerId', 'email profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return Response.json({ coupons });
  } catch (e) {
    console.error('Admin coupons GET', e);
    return Response.json({ message: 'Failed to load coupons' }, { status: 500 });
  }
}

/**
 * Bulk create admin coupons.
 * Body: { courseId, usageLimit?, expiresAt?, batches: [{ discountType, discountValue, count }] }
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
    const { courseId, batches, usageLimit, expiresAt } = body;

    if (!courseId || !Array.isArray(batches) || batches.length === 0) {
      return Response.json(
        { message: 'courseId and batches[] required' },
        { status: 400 }
      );
    }

    const course = await Course.findById(courseId).select('title price');
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    const slug = courseSlugPrefix(course.title, 6);
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

    const created = [];

    for (const batch of batches) {
      const { discountType, discountValue, count } = batch;
      const n = Math.min(100, Math.max(1, parseInt(String(count), 10) || 1));
      if (discountType !== 'flat' && discountType !== 'percent') {
        return Response.json({ message: 'Invalid discountType' }, { status: 400 });
      }
      const dv = Number(discountValue);
      if (!Number.isFinite(dv) || dv < 0) {
        return Response.json({ message: 'Invalid discountValue' }, { status: 400 });
      }
      const valPart =
        discountType === 'flat' ? `F${Math.round(dv)}` : `P${Math.round(dv)}`;
      const prefixBase = `${slug}${valPart}`;

      for (let i = 0; i < n; i++) {
        const code = await generateUniqueCouponCode(Coupon, prefixBase);
        const doc = await Coupon.create({
          code,
          discountType,
          discountValue: dv,
          courseId,
          createdBy: 'admin',
          ownerId: null,
          usageLimit: limit,
          usedCount: 0,
          expiresAt: exp,
          isActive: true,
          isLocked: false,
        });
        created.push(doc);
      }
    }

    return Response.json({
      ok: true,
      count: created.length,
      coupons: created.map((c) => ({
        _id: c._id,
        code: c.code,
        discountType: c.discountType,
        discountValue: c.discountValue,
      })),
    });
  } catch (e) {
    console.error('Admin coupons POST', e);
    return Response.json({ message: e.message || 'Create failed' }, { status: 500 });
  }
}
