import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';
import { generateUniqueReferralCode } from '@/lib/referralCode';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectDB();

    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      state,
      referralCode: referralCodeInput,
    } = req.body;

    const emailNorm = String(email || '').toLowerCase().trim();
    if (!emailNorm) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({ email: emailNorm });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email',
      });
    }

    let referredBy = null;
    if (referralCodeInput && String(referralCodeInput).trim()) {
      const upper = String(referralCodeInput)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');
      if (!upper) {
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      const referrer = await User.findOne({ referralCode: upper });
      if (!referrer) {
        return res.status(400).json({
          message: 'Invalid referral code',
        });
      }
      if (referrer.email === emailNorm) {
        return res.status(400).json({
          message: 'You cannot use your own referral code',
        });
      }
      referredBy = referrer._id;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const referralCode = await generateUniqueReferralCode(User, firstName);

    const newUser = new User({
      email: emailNorm,
      profile: {
        firstName,
        lastName,
        mobile,
        state,
      },
      auth: {
        passwordHash,
        emailVerified: false,
      },
      referredBy,
      referralLocked: true,
      isActive: false,
      referralCode,
    });

    await newUser.save();

    try {
      await sendWelcomeEmail(
        newUser.email,
        `${newUser.profile.firstName} ${newUser.profile.lastName}`
      );
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    res.status(201).json({
      message: 'Account created. Purchase a course to unlock the full platform.',
      user: {
        id: newUser._id,
        email: newUser.email,
        referralCode: newUser.referralCode,
        isActive: false,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
}
