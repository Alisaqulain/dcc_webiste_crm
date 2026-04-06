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
