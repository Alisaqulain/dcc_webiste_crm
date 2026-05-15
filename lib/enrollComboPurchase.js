import Course from '@/models/Course';
import { distributePurchaseReferrals } from '@/lib/referralCommission';
import { createPostPurchaseUserCoupons } from '@/lib/couponService';

/**
 * Enroll user in every course in a combo after successful payment.
 */
export async function enrollUserInCombo({
  user,
  combo,
  paidRupees,
  couponId,
  User,
}) {
  const courseIds = (combo.courseIds || []).map((id) => String(id));
  const courses = await Course.find({ _id: { $in: courseIds } });
  const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

  const paidPerCourse =
    courseIds.length > 0 ? Math.round((paidRupees / courseIds.length) * 100) / 100 : paidRupees;

  for (const cid of courseIds) {
    const already = user.courses.some(
      (c) => c.courseId && c.courseId.toString() === cid
    );
    if (already) continue;

    const courseDoc = courseMap.get(cid);
    const listRupees = courseDoc ? Number(courseDoc.price) || 0 : 0;

    user.courses.push({
      courseId: cid,
      purchasedAt: new Date(),
      status: 'active',
      progress: 0,
      paidAmountRupees: paidPerCourse,
      listPriceRupees: listRupees,
      comboPurchaseId: combo._id,
      ...(couponId ? { couponId } : {}),
    });

    if (courseDoc) {
      courseDoc.enrollmentCount = (courseDoc.enrollmentCount || 0) + 1;
      await courseDoc.save();
    }
  }

  user.isActive = true;

  await user.save();

  combo.enrollmentCount = (combo.enrollmentCount || 0) + 1;
  await combo.save();

  const primary = courses[0] || (await Course.findById(courseIds[0]));
  if (primary) {
    await distributePurchaseReferrals({
      buyerUser: user,
      course: primary,
      User,
      purchaseAmountRupees: paidRupees,
    });
    try {
      await createPostPurchaseUserCoupons(user._id, primary);
    } catch (e) {
      console.error('Post-purchase coupon (combo) failed:', e);
    }
  }

  return { enrolledCount: courseIds.length, primaryCourse: primary };
}
