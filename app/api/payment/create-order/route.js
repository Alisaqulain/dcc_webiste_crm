import connectDB from '@/lib/mongodb';
import razorpay from '@/lib/razorpay';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { validateCouponForCheckout } from '@/lib/couponService';

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

    const { courseId, couponCode } = await request.json();

    if (!courseId) {
      return Response.json({ message: 'Course ID is required' }, { status: 400 });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email }).select('_id');
    const userId = user?._id?.toString();

    let finalPrice = Number(course.price) || 0;
    let discountAmount = 0;
    let couponId = '';

    if (couponCode && String(couponCode).trim()) {
      const v = await validateCouponForCheckout({
        code: couponCode,
        courseId,
        userId,
      });
      if (!v.ok) {
        return Response.json({ message: v.message, success: false }, { status: 400 });
      }
      finalPrice = v.finalPrice;
      discountAmount = v.discountAmount;
      couponId = v.coupon._id.toString();
    }

    const amount = rupeesToPaiseSafe(finalPrice);

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `crs_${Date.now().toString().slice(-8)}`,
      notes: {
        courseId: String(courseId),
        userEmail: session.user.email,
        userId: userId || '',
        couponId: couponId || '',
        originalPriceRupees: String(Number(course.price) || 0),
        finalPriceRupees: String(finalPrice),
      },
    });

    return Response.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
      pricing: {
        originalPrice: course.price,
        finalPrice,
        discountAmount,
        couponApplied: Boolean(couponId),
        couponId: couponId || null,
      },
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    return Response.json(
      {
        message: 'Error creating payment order',
        error: error.message,
        success: false,
      },
      { status: 500 }
    );
  }
}
