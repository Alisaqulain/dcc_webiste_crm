import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

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

function buildMatchStages(courseFilter, q) {
  const matchUser = { 'courses.0': { $exists: true } };
  if (q.trim()) {
    const esc = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(esc, 'i');
    matchUser.$or = [
      { email: rx },
      { 'profile.firstName': rx },
      { 'profile.lastName': rx },
    ];
  }
  const stages = [{ $match: matchUser }, { $unwind: '$courses' }];
  if (courseFilter && mongoose.Types.ObjectId.isValid(courseFilter)) {
    stages.push({
      $match: {
        'courses.courseId': new mongoose.Types.ObjectId(courseFilter),
      },
    });
  }
  return stages;
}

export async function GET(request) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(String(searchParams.get('page') || '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(searchParams.get('limit') || '50'), 10) || 50));
    const courseFilter = searchParams.get('courseId') || '';
    const q = searchParams.get('q') || '';

    const baseStages = buildMatchStages(courseFilter, q);

    const countAgg = await User.aggregate([
      ...baseStages,
      { $count: 'total' },
    ]);
    const total = countAgg[0]?.total || 0;

    const rows = await User.aggregate([
      ...baseStages,
      { $sort: { 'courses.purchasedAt': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.courseId',
          foreignField: '_id',
          as: 'courseDoc',
        },
      },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'coupons',
          localField: 'courses.couponId',
          foreignField: '_id',
          as: 'couponDoc',
        },
      },
      { $unwind: { path: '$couponDoc', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: 1,
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$profile.firstName', ''] },
                  ' ',
                  { $ifNull: ['$profile.lastName', ''] },
                ],
              },
            },
          },
          mobile: '$profile.mobile',
          purchasedAt: '$courses.purchasedAt',
          enrollmentStatus: '$courses.status',
          progress: '$courses.progress',
          paidAmountRupees: '$courses.paidAmountRupees',
          listPriceRupees: '$courses.listPriceRupees',
          courseId: '$courses.courseId',
          courseTitle: '$courseDoc.title',
          coursePriceNow: '$courseDoc.price',
          couponCode: '$couponDoc.code',
          couponDiscountType: '$couponDoc.discountType',
          couponDiscountValue: '$couponDoc.discountValue',
        },
      },
    ]);

    const normalized = rows.map((r) => {
      const name =
        String(r.userName || '').trim() ||
        r.email ||
        'Unknown';
      const list =
        r.listPriceRupees != null && r.listPriceRupees !== ''
          ? Number(r.listPriceRupees)
          : Number(r.coursePriceNow) || 0;
      const paid =
        r.paidAmountRupees != null && r.paidAmountRupees !== ''
          ? Number(r.paidAmountRupees)
          : null;
      let couponLabel = null;
      if (r.couponCode) {
        couponLabel =
          r.couponDiscountType === 'percent'
            ? `${r.couponCode} (${r.couponDiscountValue}%)`
            : `${r.couponCode} (₹${r.couponDiscountValue})`;
      }
      return {
        userId: String(r.userId),
        email: r.email,
        userName: name,
        mobile: r.mobile || '',
        courseId: r.courseId ? String(r.courseId) : '',
        courseTitle: r.courseTitle || '—',
        listPriceRupees: list,
        paidAmountRupees: paid,
        legacyPricing: paid == null,
        purchasedAt: r.purchasedAt,
        enrollmentStatus: r.enrollmentStatus,
        progress: r.progress,
        couponLabel,
        coursePriceNow: Number(r.coursePriceNow) || 0,
      };
    });

    const summaryAgg = await User.aggregate([
      ...buildMatchStages('', ''),
      {
        $lookup: {
          from: 'courses',
          localField: 'courses.courseId',
          foreignField: '_id',
          as: 'courseDoc',
        },
      },
      { $unwind: { path: '$courseDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$courses.courseId',
          title: { $first: '$courseDoc.title' },
          purchaseCount: { $sum: 1 },
          sumPaidRecorded: {
            $sum: {
              $cond: [
                { $ne: ['$courses.paidAmountRupees', null] },
                { $toDouble: '$courses.paidAmountRupees' },
                0,
              ],
            },
          },
          paidRows: {
            $sum: {
              $cond: [{ $ne: ['$courses.paidAmountRupees', null] }, 1, 0],
            },
          },
        },
      },
      { $sort: { purchaseCount: -1 } },
    ]);

    const byCourse = summaryAgg.map((s) => ({
      courseId: s._id ? String(s._id) : '',
      title: s.title || '—',
      purchaseCount: s.purchaseCount,
      sumPaidRecorded: Math.round(s.sumPaidRecorded * 100) / 100,
      paidRows: s.paidRows,
    }));

    return Response.json({
      purchases: normalized,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
      byCourse,
    });
  } catch (e) {
    console.error('Admin purchases GET', e);
    return Response.json({ message: 'Failed to load purchases' }, { status: 500 });
  }
}
