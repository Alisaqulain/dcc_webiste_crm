import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
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

export async function PUT(request, { params }) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const body = await request.json();

    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return Response.json({ message: 'Not found' }, { status: 404 });
    }

    if (body.discountValue !== undefined) {
      const dv = Number(body.discountValue);
      if (!Number.isFinite(dv) || dv < 0) {
        return Response.json({ message: 'Invalid discountValue' }, { status: 400 });
      }
      coupon.discountValue = dv;
    }
    if (body.discountType !== undefined) {
      if (body.discountType !== 'flat' && body.discountType !== 'percent') {
        return Response.json({ message: 'Invalid discountType' }, { status: 400 });
      }
      coupon.discountType = body.discountType;
    }
    if (body.usageLimit !== undefined) {
      coupon.usageLimit = Math.max(0, parseInt(String(body.usageLimit), 10) || 0);
    }
    if (body.expiresAt !== undefined) {
      if (body.expiresAt === null || body.expiresAt === '') {
        coupon.expiresAt = null;
      } else {
        const d = new Date(body.expiresAt);
        coupon.expiresAt = Number.isNaN(d.getTime()) ? coupon.expiresAt : d;
      }
    }
    if (body.isActive !== undefined) {
      coupon.isActive = Boolean(body.isActive);
    }
    if (body.isLocked !== undefined) {
      coupon.isLocked = Boolean(body.isLocked);
    }
    if (body.courseId !== undefined) {
      const raw = body.courseId;
      if (raw === null || raw === '' || raw === '__ALL__') {
        coupon.set('courseId', null);
      } else {
        const exists = await Course.findById(raw).select('_id').lean();
        if (!exists) {
          return Response.json({ message: 'Course not found' }, { status: 400 });
        }
        coupon.courseId = raw;
      }
    }

    if (body.ownerEmail !== undefined) {
      const em = String(body.ownerEmail || '').toLowerCase().trim();
      if (!em) {
        coupon.ownerId = null;
        coupon.createdBy = 'admin';
      } else {
        const u = await User.findOne({ email: em }).select('_id');
        if (!u) {
          return Response.json(
            { message: 'Owner user not found for that email' },
            { status: 400 }
          );
        }
        coupon.ownerId = u._id;
        coupon.createdBy = 'user';
      }
    }

    await coupon.save();

    return Response.json({ ok: true, coupon });
  } catch (e) {
    console.error('Admin coupon PUT', e);
    return Response.json({ message: 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();
    const { id } = params;
    const res = await Coupon.findByIdAndDelete(id);
    if (!res) {
      return Response.json({ message: 'Not found' }, { status: 404 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Admin coupon DELETE', e);
    return Response.json({ message: 'Delete failed' }, { status: 500 });
  }
}
