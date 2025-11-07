import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ message: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return Response.json({ message: 'New password must be at least 6 characters long' }, { status: 400 });
    }

    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has a password (not Google-only account)
    if (!user.auth?.passwordHash) {
      return Response.json({ message: 'Password change not available for Google accounts. Please use password reset.' }, { status: 400 });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.auth.passwordHash);

    if (!isPasswordValid) {
      return Response.json({ message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password
    user.auth.passwordHash = passwordHash;
    await user.save();

    return Response.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    return Response.json({ 
      message: 'Internal server error',
      error: error.message 
    }, { status: 500 });
  }
}

