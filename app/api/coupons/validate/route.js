import connectDB from '@/lib/mongodb';
import { getAuthDbUser } from '@/lib/getAuthDbUser';
import { validateCouponForCheckout } from '@/lib/couponService';

export async function POST(request) {
  try {
    const { session, userId, email } = await getAuthDbUser();
    if (!session?.user?.email || !userId) {
      return Response.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, comboId, code } = await request.json();
    if ((!courseId && !comboId) || !code) {
      return Response.json(
        { ok: false, message: 'Course or combo and coupon code are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await validateCouponForCheckout({
      code,
      courseId: courseId || undefined,
      comboId: comboId || undefined,
      userId,
      userEmail: email,
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
