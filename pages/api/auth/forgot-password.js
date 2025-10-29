import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    // Save reset token to user (you might want to add these fields to your User model)
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // Send password reset email
    const resetLink = `${process.env.NEXTAUTH_URL || 'https://www.digitalcareercenter.com'}/reset-password?token=${resetToken}`;
    
    const emailResult = await sendPasswordResetEmail(email, resetLink);
    
    if (emailResult.success) {
      res.status(200).json({
        message: 'Password reset instructions have been sent to your email address. Please check your inbox and spam folder.'
      });
    } else {
      // If email fails, still save the token but inform user
      res.status(200).json({
        message: 'Password reset token generated. Please check your email or contact support if you don\'t receive the email within a few minutes.',
        emailError: emailResult.error
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
