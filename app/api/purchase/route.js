import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { distributePurchaseReferrals } from '@/lib/referralCommission';
import {
  validateCouponForCheckout,
  consumeCouponById,
  createPostPurchaseUserCoupons,
  computeFinalPrice,
} from '@/lib/couponService';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return Response.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

    const { courseId, userId, couponCode } = await request.json();

    if (!courseId) {
      return Response.json(
        { message: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    if (userId && user._id.toString() !== String(userId)) {
      return Response.json({ message: 'Forbidden' }, { status: 403 });
    }
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    const existingCourse = user.courses.find(
      (c) => c.courseId.toString() === courseId
    );
    if (existingCourse) {
      return Response.json(
        { message: 'Course already purchased' },
        { status: 400 }
      );
    }

    let couponIdToConsume = null;
    const listRupees = Number(course.price) || 0;
    let paidRupees = listRupees;
    if (couponCode && String(couponCode).trim()) {
      const v = await validateCouponForCheckout({
        code: couponCode,
        courseId,
        userId: session.user.id,
        userEmail: session.user.email,
      });
      if (!v.ok) {
        return Response.json({ message: v.message }, { status: 400 });
      }
      couponIdToConsume = v.coupon._id.toString();
      const { finalPrice } = computeFinalPrice(
        listRupees,
        v.coupon.discountType,
        v.coupon.discountValue
      );
      paidRupees = finalPrice;
    }

    user.courses.push({
      courseId,
      purchasedAt: new Date(),
      status: 'active',
      progress: 0,
      paidAmountRupees: paidRupees,
      listPriceRupees: listRupees,
      ...(couponIdToConsume ? { couponId: couponIdToConsume } : {}),
    });
    user.isActive = true;
    await user.save();

    course.enrollmentCount = (course.enrollmentCount || 0) + 1;
    await course.save();

    if (couponIdToConsume) {
      const consumed = await consumeCouponById(couponIdToConsume);
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
      purchaseAmountRupees: paidRupees,
    });

    try {
      await createPostPurchaseUserCoupons(user._id, course);
    } catch (rewardErr) {
      console.error('Post-purchase coupon generation failed:', rewardErr);
    }

    return Response.json({
      message: 'Course purchased successfully',
      isActive: true,
      course: {
        id: course._id,
        title: course.title,
        price: course.price,
      },
    });
  } catch (error) {
    console.error('Error processing purchase:', error);
    return Response.json(
      { message: 'Error processing purchase' },
      { status: 500 }
    );
  }
}
