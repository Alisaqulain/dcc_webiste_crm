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
    const referrals = await Referral.find()
      .populate('referrer', 'email')
      .populate('referredUser', 'email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .lean();
    return Response.json({ referrals });
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


