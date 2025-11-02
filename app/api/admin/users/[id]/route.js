import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Referral from '@/models/Referral';

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

export async function DELETE(request, { params }) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Delete associated referrals
    await Referral.deleteMany({
      $or: [
        { referrer: id },
        { referredUser: id }
      ]
    });

    // Delete the user
    await User.findByIdAndDelete(id);

    return Response.json({
      ok: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    console.error('Admin DELETE user error:', error);
    return Response.json({ message: 'Failed to delete user', error: error.message }, { status: 500 });
  }
}
