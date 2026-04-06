import connectDB from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { validateCouponForCheckout } from '@/lib/couponService';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, code } = await request.json();
    if (!courseId || !code) {
      return Response.json(
        { ok: false, message: 'Course and coupon code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const result = await validateCouponForCheckout({
      code,
      courseId,
      userId,
    });

    if (!result.ok) {
      return Response.json({ ok: false, message: result.message }, { status: 400 });
    }

    return Response.json({
      ok: true,
      originalPrice: result.originalPrice,
      finalPrice: result.finalPrice,
      discountAmount: result.discountAmount,
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      couponId: result.coupon._id.toString(),
      code: result.coupon.code,
    });
  } catch (e) {
    console.error('Coupon validate error:', e);
    return Response.json({ ok: false, message: 'Validation failed' }, { status: 500 });
  }
}
