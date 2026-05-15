import connectDB from '@/lib/mongodb';
import razorpay from '@/lib/razorpay';
import Course from '@/models/Course';
import ComboCourse from '@/models/ComboCourse';
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

    const { courseId, comboId, couponCode } = await request.json();

    if (!courseId && !comboId) {
      return Response.json(
        { message: 'Course ID or combo ID is required' },
        { status: 400 }
      );
    }

    const emailNorm = String(session.user.email).toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm }).select('_id courses');
    const userId = user?._id?.toString();

    let finalPrice = 0;
    let listPrice = 0;
    let discountAmount = 0;
    let couponId = '';
    let notes = {
      userEmail: emailNorm,
      userId: userId || '',
      couponId: '',
      originalPriceRupees: '0',
      finalPriceRupees: '0',
    };

    if (comboId) {
      const combo = await ComboCourse.findById(comboId);
      if (!combo || !combo.isPublished) {
        return Response.json({ message: 'Combo not found' }, { status: 404 });
      }

      const owned = (user?.courses || []).map((c) => c.courseId?.toString());
      const missing = combo.courseIds.filter((id) => !owned.includes(id.toString()));
      if (missing.length === 0) {
        return Response.json({ message: 'You already own all courses in this combo' }, { status: 400 });
      }

      listPrice = Number(combo.price) || 0;
      finalPrice = listPrice;

      if (couponCode && String(couponCode).trim()) {
        const v = await validateCouponForCheckout({
          code: couponCode,
          comboId,
          userId,
          userEmail: emailNorm,
        });
        if (!v.ok) {
          return Response.json({ message: v.message, success: false }, { status: 400 });
        }
        finalPrice = v.finalPrice;
        discountAmount = v.discountAmount;
        couponId = v.coupon._id.toString();
      }

      notes = {
        ...notes,
        comboId: String(comboId),
        purchaseType: 'combo',
        couponId: couponId || '',
        originalPriceRupees: String(listPrice),
        finalPriceRupees: String(finalPrice),
      };
    } else {
      const course = await Course.findById(courseId);
      if (!course) {
        return Response.json({ message: 'Course not found' }, { status: 404 });
      }

      listPrice = Number(course.price) || 0;
      finalPrice = listPrice;

      if (couponCode && String(couponCode).trim()) {
      const v = await validateCouponForCheckout({
        code: couponCode,
        courseId,
        userId,
        userEmail: emailNorm,
      });
        if (!v.ok) {
          return Response.json({ message: v.message, success: false }, { status: 400 });
        }
        finalPrice = v.finalPrice;
        discountAmount = v.discountAmount;
        couponId = v.coupon._id.toString();
      }

      notes = {
        ...notes,
        courseId: String(courseId),
        purchaseType: 'course',
        couponId: couponId || '',
        originalPriceRupees: String(listPrice),
        finalPriceRupees: String(finalPrice),
      };
    }

    const amount = rupeesToPaiseSafe(finalPrice);

    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `crs_${Date.now().toString().slice(-8)}`,
      notes,
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
        originalPrice: listPrice,
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
