import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

export async function POST(request) {
  try {
    await connectDB();
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, referralCode } = await request.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId) {
      return Response.json({ message: 'Missing required payment details' }, { status: 400 });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ message: 'Invalid payment signature' }, { status: 400 });
    }

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    // Get user details
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user already has this course
    if (user.courses.includes(courseId)) {
      return Response.json({ message: 'Course already purchased' }, { status: 400 });
    }

    // Add course to user's courses
    user.courses.push(courseId);
    await user.save();

    // Update course enrollment count
    course.enrollmentCount += 1;
    await course.save();

    // Handle referral system
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode });
      if (referrer && referrer.email !== user.email) {
        // Add referral bonus (you can customize this)
        referrer.referralEarnings = (referrer.referralEarnings || 0) + Math.round(course.price * 0.1); // 10% referral bonus
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();

        // Send referral bonus email to referrer
        await sendEmail({
          to: referrer.email,
          subject: 'Referral Bonus Earned! 🎉',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">Congratulations! You've earned a referral bonus!</h2>
              <p>Your friend <strong>${user.name || user.email}</strong> just purchased the course <strong>"${course.title}"</strong> using your referral code.</p>
              <p><strong>Referral Bonus:</strong> ₹${Math.round(course.price * 0.1)}</p>
              <p><strong>Total Referral Earnings:</strong> ₹${referrer.referralEarnings}</p>
              <p>Keep sharing your referral code to earn more!</p>
              <p>Your Referral Code: <strong>${referrer.referralCode}</strong></p>
            </div>
          `
        });
      }
    }

    // Send purchase confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Course Purchase Successful! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Congratulations! Your course purchase was successful!</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Course Details:</h3>
            <p><strong>Course:</strong> ${course.title}</p>
            <p><strong>Price:</strong> ₹${course.price}</p>
            <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
            <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
          </div>
          
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Refer & Earn Program:</h3>
            <p>Share your referral code with friends and earn 10% commission on their course purchases!</p>
            <p><strong>Your Referral Code:</strong> <span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px;">${user.referralCode || 'REF' + user._id.toString().slice(-6).toUpperCase()}</span></p>
            <p>Share this code: <strong>${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?ref=${user.referralCode || 'REF' + user._id.toString().slice(-6).toUpperCase()}</strong></p>
          </div>
          
          <p>You can now access your course in the "My Courses" section.</p>
          <p>Thank you for choosing Digital Career Center!</p>
        </div>
      `
    });

    return Response.json({
      success: true,
      message: 'Payment verified successfully',
      course: {
        id: course._id,
        title: course.title,
        price: course.price
      }
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return Response.json({ 
      message: 'Error verifying payment',
      error: error.message 
    }, { status: 500 });
  }
}
