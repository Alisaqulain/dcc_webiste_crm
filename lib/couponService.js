import Coupon from '@/models/Coupon';
import Course from '@/models/Course';
import User from '@/models/User';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

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
/** Post-purchase rewards are shareable gifts. Admin GIFT* codes stay private (one learner only). */
export function isShareableRewardCoupon(coupon) {
  if (!coupon) return false;
  const code = String(coupon.code || '').toUpperCase();
  if (code.startsWith('GIFT')) return false;
  if (coupon.isShareable === true) return true;
  // Do not use `isShareable === false` — Mongoose defaults missing field to false on hydrated docs.
  if (coupon.createdBy === 'user') return true;
  // Legacy rows: post-purchase codes contain P20 in the code prefix pattern
  if (code.includes('P20') && coupon.ownerId) return true;
  return false;
}

export function isPrivateAssignedUserCoupon(coupon) {
  if (!coupon?.ownerId || coupon.createdBy !== 'user') return false;
  return !isShareableRewardCoupon(coupon);
}

export function couponOwnerMatches(coupon, userIdStr) {
  if (!userIdStr || !coupon?.ownerId) return false;
  const ownerRaw = coupon.ownerId?._id ?? coupon.ownerId;
  const ownerStr = String(ownerRaw);
  const userStr = String(userIdStr);
  if (ownerStr === userStr) return true;
  if (
    mongoose.Types.ObjectId.isValid(ownerStr) &&
    mongoose.Types.ObjectId.isValid(userStr)
  ) {
    return new mongoose.Types.ObjectId(ownerStr).equals(
      new mongoose.Types.ObjectId(userStr)
    );
  }
  return false;
}

export function getCouponValidationError(coupon, courseIdStr, userIdStr) {
  if (!coupon) return 'Coupon not found';
  const now = new Date();
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return 'Coupon has expired';
  }
  if (!coupon.isActive) return 'Coupon is no longer active';
  if (coupon.isLocked) return 'Coupon is locked';
  const couponCid = coupon.courseId;
  const hasSpecificCourse =
    couponCid != null &&
    couponCid !== '' &&
    String(couponCid) !== 'undefined';
  if (hasSpecificCourse && String(couponCid) !== String(courseIdStr)) {
    return 'Coupon does not apply to this course';
  }
  const limit = Number(coupon.usageLimit) || 0;
  if (limit > 0 && (coupon.usedCount || 0) >= limit) {
    return 'Coupon usage limit reached';
  }
  if (isPrivateAssignedUserCoupon(coupon)) {
    if (!userIdStr) {
      return 'Sign in to use this coupon.';
    }
    if (!couponOwnerMatches(coupon, userIdStr)) {
      return 'This coupon is assigned to another account.';
    }
  }
  if (isShareableRewardCoupon(coupon) && !userIdStr) {
    return 'Sign in or create an account to use this shared coupon at checkout.';
  }
  if (
    isShareableRewardCoupon(coupon) &&
    userIdStr &&
    coupon.ownerId &&
    couponOwnerMatches(coupon, userIdStr)
  ) {
    return 'You cannot use your own gift coupon — share this code with a friend for them to use at checkout.';
  }
  if (coupon.discountType === 'percent' && coupon.discountValue > 100) {
    return 'Invalid coupon configuration';
  }
  return null;
}

/** Resolve MongoDB user id — always prefer DB lookup by email (JWT id can be stale). */
export async function resolveCheckoutUserId({ userId, userEmail }) {
  const email = userEmail ? String(userEmail).toLowerCase().trim() : '';
  if (email) {
    await connectDB();
    const u = await User.findOne({ email }).select('_id').lean();
    if (u?._id) return u._id.toString();
  }
  if (userId) return String(userId);
  return null;
}

export async function validateCouponForCheckout({
  code,
  courseId,
  comboId,
  userId,
  userEmail,
}) {
  const norm = normalizeCouponCode(code);
  if (!norm) {
    return { ok: false, message: 'Enter a coupon code' };
  }
  if (!courseId && !comboId) {
    return { ok: false, message: 'Course or combo is required' };
  }

  const resolvedUserId = await resolveCheckoutUserId({ userId, userEmail });
  let coupon = await Coupon.findOne({ code: norm }).lean();
  if (!coupon) {
    coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    }).lean();
  }

  const productId = courseId || comboId;
  const err = getCouponValidationError(coupon, productId, resolvedUserId);
  if (err) {
    return { ok: false, message: err };
  }

  let listPrice = 0;
  let productTitle = '';

  if (comboId) {
    const ComboCourse = (await import('@/models/ComboCourse')).default;
    const combo = await ComboCourse.findById(comboId).select('price title isPublished').lean();
    if (!combo || !combo.isPublished) {
      return { ok: false, message: 'Combo not found' };
    }
    listPrice = Number(combo.price) || 0;
    productTitle = combo.title;
  } else {
    const course = await Course.findById(courseId).select('price title').lean();
    if (!course) {
      return { ok: false, message: 'Course not found' };
    }
    listPrice = Number(course.price) || 0;
    productTitle = course.title;
  }

  const { finalPrice, discountAmount } = computeFinalPrice(
    listPrice,
    coupon.discountType,
    coupon.discountValue
  );

  return {
    ok: true,
    coupon,
    originalPrice: listPrice,
    finalPrice,
    discountAmount,
    productTitle,
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
    const ownerObjectId =
      ownerId instanceof mongoose.Types.ObjectId
        ? ownerId
        : new mongoose.Types.ObjectId(String(ownerId));

    const c = await Coupon.create({
      code,
      discountType: 'percent',
      discountValue: USER_REWARD_PERCENT,
      createdBy: 'user',
      ownerId: ownerObjectId,
      usageLimit: 1,
      usedCount: 0,
      expiresAt,
      isActive: true,
      isLocked: false,
      isShareable: true,
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
