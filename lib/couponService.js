import Coupon from '@/models/Coupon';
import Course from '@/models/Course';

export function computeFinalPrice(basePrice, discountType, discountValue) {
  const p = Number(basePrice) || 0;
  let discount = 0;
  const dv = Number(discountValue) || 0;
  if (discountType === 'flat') {
    discount = Math.min(p, Math.max(0, dv));
  } else {
    discount = Math.min(p, (p * Math.min(100, Math.max(0, dv))) / 100);
  }
  const final = Math.max(0, Math.round(p - discount));
  return {
    finalPrice: final,
    discountAmount: Math.round(p - final),
  };
}

export function normalizeCouponCode(code) {
  if (!code || typeof code !== 'string') return '';
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function courseSlugPrefix(title, maxLen = 6) {
  const s = String(title || 'COURSE')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  return (s.slice(0, maxLen) || 'CRS').slice(0, maxLen);
}

export async function generateUniqueCouponCode(CouponModel, prefixBase) {
  const base = String(prefixBase || 'CPN')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 14);
  for (let i = 0; i < 80; i++) {
    const rnd = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(2, 6);
    const code = `${base}${rnd || Math.floor(1000 + Math.random() * 9000)}`.slice(0, 24);
    const exists = await CouponModel.exists({ code });
    if (!exists) return code;
  }
  return `${base}${Date.now().toString(36).toUpperCase()}`.slice(0, 24);
}

/**
 * @param {object} coupon — lean or doc
 * @param {string} courseIdStr
 * @param {string|null} userIdStr — current buyer
 */
export function getCouponValidationError(coupon, courseIdStr, userIdStr) {
  if (!coupon) return 'Coupon not found';
  const now = new Date();
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return 'Coupon has expired';
  }
  if (!coupon.isActive) return 'Coupon is no longer active';
  if (coupon.isLocked) return 'Coupon is locked';
  if (String(coupon.courseId) !== String(courseIdStr)) {
    return 'Coupon does not apply to this course';
  }
  const limit = Number(coupon.usageLimit) || 0;
  if (limit > 0 && (coupon.usedCount || 0) >= limit) {
    return 'Coupon usage limit reached';
  }
  if (coupon.createdBy === 'user' && coupon.ownerId) {
    if (!userIdStr || String(coupon.ownerId) !== String(userIdStr)) {
      return 'This coupon is not valid for your account';
    }
  }
  if (coupon.discountType === 'percent' && coupon.discountValue > 100) {
    return 'Invalid coupon configuration';
  }
  return null;
}

export async function validateCouponForCheckout({
  code,
  courseId,
  userId,
}) {
  const norm = normalizeCouponCode(code);
  if (!norm) {
    return { ok: false, message: 'Enter a coupon code' };
  }
  const coupon = await Coupon.findOne({ code: norm });
  const err = getCouponValidationError(coupon, courseId, userId);
  if (err) {
    return { ok: false, message: err };
  }
  const course = await Course.findById(courseId).select('price title');
  if (!course) {
    return { ok: false, message: 'Course not found' };
  }
  const { finalPrice, discountAmount } = computeFinalPrice(
    course.price,
    coupon.discountType,
    coupon.discountValue
  );
  return {
    ok: true,
    coupon,
    course,
    originalPrice: course.price,
    finalPrice,
    discountAmount,
  };
}

export async function consumeCouponById(couponId) {
  if (!couponId) return { ok: true, skipped: true };
  const id = String(couponId);
  const coupon = await Coupon.findById(id);
  if (!coupon) return { ok: false, message: 'Coupon not found' };

  const limit = Number(coupon.usageLimit) || 0;
  const filter = {
    _id: id,
    isActive: true,
    isLocked: false,
  };
  if (limit > 0) {
    filter.usedCount = { $lt: limit };
  }

  const updated = await Coupon.findOneAndUpdate(filter, { $inc: { usedCount: 1 } }, {
    new: true,
  });

  if (!updated) {
    return { ok: false, message: 'Coupon could not be applied (limit or status)' };
  }

  const newLimit = Number(updated.usageLimit) || 0;
  if (newLimit > 0 && updated.usedCount >= newLimit) {
    await Coupon.updateOne({ _id: id }, { $set: { isActive: false } });
  }

  return { ok: true, coupon: updated };
}

const USER_REWARD_COUNT = 3;
const USER_REWARD_PERCENT = 20;
const USER_REWARD_DAYS = 30;

export async function createPostPurchaseUserCoupons(ownerId, courseDoc) {
  const prefixBase = `${courseSlugPrefix(courseDoc.title)}U${String(ownerId).slice(-4)}`;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + USER_REWARD_DAYS);

  const created = [];
  for (let i = 0; i < USER_REWARD_COUNT; i++) {
    const code = await generateUniqueCouponCode(Coupon, `${prefixBase}P20`);
    const c = await Coupon.create({
      code,
      discountType: 'percent',
      discountValue: USER_REWARD_PERCENT,
      courseId: courseDoc._id,
      createdBy: 'user',
      ownerId,
      usageLimit: 1,
      usedCount: 0,
      expiresAt,
      isActive: true,
      isLocked: false,
    });
    created.push(c);
  }
  return created;
}

export async function lockExpiredCouponsNow() {
  const now = new Date();
  const res = await Coupon.updateMany(
    {
      expiresAt: { $lt: now },
      isLocked: false,
    },
    { $set: { isLocked: true } }
  );
  return res.modifiedCount || 0;
}
