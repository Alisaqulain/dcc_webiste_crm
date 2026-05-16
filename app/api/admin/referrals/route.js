import connectDB from '@/lib/mongodb';
import Referral from '@/models/Referral';
import '@/models/Course';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
  } catch (e) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const total = await Referral.countDocuments();
    const referrals = await Referral.find()
      .populate('referrer', 'email profile.firstName profile.lastName referralCode')
      .populate('referredUser', 'email profile.firstName profile.lastName')
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return Response.json({
      referrals,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin GET referrals error', error);
    return Response.json({ message: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    await connectDB();
    const { id, status, notes } = await request.json();
    if (!id || !status) {
      return Response.json({ message: 'id and status required' }, { status: 400 });
    }
    const updated = await Referral.findByIdAndUpdate(
      id,
      { status, notes, updatedAt: new Date() },
      { new: true }
    ).lean();
    return Response.json({ ok: true, referral: updated });
  } catch (error) {
    console.error('Admin PUT referrals error', error);
    return Response.json({ message: 'Failed to update referral' }, { status: 500 });
  }
}


