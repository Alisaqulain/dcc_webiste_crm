import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/email';

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
      referralCode,
      couponCode,
      selectedPackage,
      selectedPayment 
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email' 
      });
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referredBy = referrer._id;
      } else {
        return res.status(400).json({ 
          message: 'Invalid referral code' 
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email,
      profile: {
        firstName,
        lastName,
        mobile,
        state
      },
      auth: {
        passwordHash,
        emailVerified: false
      },
      referredBy
    });

    await newUser.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(newUser.email, `${newUser.profile.firstName} ${newUser.profile.lastName}`);
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // Don't fail the signup if email fails
    }

    // Update referrer's earnings if referral code was used
    if (referredBy) {
      // This will be processed when the user actually purchases a course
      console.log(`User ${newUser._id} was referred by ${referredBy}`);
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        email: newUser.email,
        referralCode: newUser.referralCode
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
