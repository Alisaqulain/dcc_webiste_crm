import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import Coupon from '@/models/Coupon';
import razorpay from '@/lib/razorpay';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { distributePurchaseReferrals } from '@/lib/referralCommission';
import {
  computeFinalPrice,
  getCouponValidationError,
  consumeCouponById,
  createPostPurchaseUserCoupons,
} from '@/lib/couponService';

function rupeesToPaiseSafe(rupees) {
  const r = Math.max(0, Number(rupees) || 0);
  const paise = Math.round(r * 100);
  return Math.max(100, paise);
}

export async function POST(request) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
    } = await request.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !courseId
    ) {
      return Response.json(
        { message: 'Missing required payment details' },
        { status: 400 }
      );
    }

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return Response.json({ message: 'Invalid payment signature' }, { status: 400 });
    }

    const order = await razorpay.orders.fetch(razorpay_order_id);
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return Response.json({ message: 'Payment does not match order' }, { status: 400 });
    }

    const notes = order.notes || {};
    const noteCourseId = notes.courseId ? String(notes.courseId) : null;
    if (noteCourseId && noteCourseId !== String(courseId)) {
      return Response.json({ message: 'Order course mismatch' }, { status: 400 });
    }

    if (notes.userEmail && notes.userEmail !== session.user.email) {
      return Response.json({ message: 'Order user mismatch' }, { status: 403 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const userIdStr = user._id.toString();

    const origFromNote = Number(notes.originalPriceRupees);
    const coursePrice = Number(course.price) || 0;
    if (Number.isFinite(origFromNote) && Math.abs(origFromNote - coursePrice) > 0.01) {
      return Response.json({ message: 'Price changed — create a new order' }, { status: 400 });
    }

    let expectedPaise;
    const couponIdFromNote = notes.couponId ? String(notes.couponId) : '';

    if (couponIdFromNote) {
      const coupon = await Coupon.findById(couponIdFromNote);
      const err = getCouponValidationError(coupon, courseId, userIdStr);
      if (err) {
        return Response.json({ message: err }, { status: 400 });
      }
      const { finalPrice } = computeFinalPrice(
        coursePrice,
        coupon.discountType,
        coupon.discountValue
      );
      expectedPaise = rupeesToPaiseSafe(finalPrice);
    } else {
      expectedPaise = rupeesToPaiseSafe(coursePrice);
    }

    const orderAmount = Number(order.amount);
    const payAmount = Number(payment.amount);
    if (orderAmount !== expectedPaise || payAmount !== expectedPaise) {
      return Response.json(
        { message: 'Paid amount does not match order' },
        { status: 400 }
      );
    }

    const existingCourse = user.courses.find(
      (c) => c.courseId && c.courseId.toString() === courseId
    );
    if (existingCourse) {
      return Response.json(
        { message: 'Course already purchased' },
        { status: 400 }
      );
    }

    user.courses.push({
      courseId,
      purchasedAt: new Date(),
      status: 'active',
      progress: 0,
    });
    user.isActive = true;
    await user.save();

    course.enrollmentCount += 1;
    await course.save();

    if (couponIdFromNote) {
      const consumed = await consumeCouponById(couponIdFromNote);
      if (!consumed.ok) {
        user.courses = user.courses.filter(
          (c) => !(c.courseId && c.courseId.toString() === String(courseId))
        );
        await user.save();
        course.enrollmentCount = Math.max(0, (course.enrollmentCount || 1) - 1);
        await course.save();
        return Response.json({ message: consumed.message }, { status: 400 });
      }
    }

    await distributePurchaseReferrals({
      buyerUser: user,
      course,
      User,
    });

    try {
      await createPostPurchaseUserCoupons(user._id, course);
    } catch (rewardErr) {
      console.error('Post-purchase coupon generation failed:', rewardErr);
    }

    await sendEmail({
      to: user.email,
      subject: 'Course Purchase Successful! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Congratulations! Your course purchase was successful!</h2>
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Course Details:</h3>
            <p><strong>Course:</strong> ${course.title}</p>
            <p><strong>List price:</strong> ₹${course.price}</p>
            <p><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
            <p><strong>Order ID:</strong> ${razorpay_order_id}</p>
          </div>
          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Refer & Earn Program:</h3>
            <p>Share your referral link at signup. Earn up to 35% / 10% / 5% across three levels when your network purchases courses.</p>
            <p><strong>Your Referral Code:</strong> <span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px;">${user.referralCode || ''}</span></p>
            <p><strong>Share:</strong> ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/signup?ref=${user.referralCode || ''}</p>
          </div>
          <p>Check your profile for reward coupons (20% off this course, valid 30 days).</p>
          <p>You can now access your course in the "My Courses" section.</p>
          <p>Thank you for choosing Digital Career Center!</p>
        </div>
      `,
    });

    return Response.json({
      success: true,
      message: 'Payment verified successfully',
      isActive: true,
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return Response.json(
      {
        message: 'Error verifying payment',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
