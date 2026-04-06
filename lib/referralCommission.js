import Referral from '@/models/Referral';
import { sendEmail } from '@/lib/email';
import { referralCommissionRupees, referralPercentForLevel } from '@/lib/referralRates';

/**
 * Credit upline (up to 3 levels) on a course purchase. Uses buyer.referredBy chain.
 * @param {number} [purchaseAmountRupees] — amount the buyer actually paid (use so tiers are 35%/10%/5% of real payment, not list price after coupons).
 */
export async function distributePurchaseReferrals({
  buyerUser,
  course,
  User,
  purchaseAmountRupees,
}) {
  const listPrice = Number(course.price) || 0;
  const paid =
    purchaseAmountRupees != null &&
    Number.isFinite(Number(purchaseAmountRupees)) &&
    Number(purchaseAmountRupees) > 0
      ? Number(purchaseAmountRupees)
      : listPrice;
  const base = paid > 0 ? paid : listPrice;
  if (base <= 0) return;

  const buyerId = buyerUser._id;
  const buyerEmail = buyerUser.email;

  let parentId = buyerUser.referredBy;
  const visited = new Set([buyerId.toString()]);

  for (let level = 1; level <= 3; level++) {
    if (!parentId) break;
    const pid = parentId.toString();
    if (visited.has(pid)) break;
    visited.add(pid);

    const parent = await User.findById(parentId).select(
      'email referralCode referredBy referralEarnings referralCount profile.firstName profile.lastName'
    );
    if (!parent) break;
    if (String(parent._id) === String(buyerId)) break;

    const commission = referralCommissionRupees(base, level);
    const pct = referralPercentForLevel(level);

    const existing = await Referral.findOne({
      referrer: parent._id,
      referredUser: buyerId,
      course: course._id,
      level,
    });

    if (!existing && commission > 0) {
      await Referral.create({
        referrer: parent._id,
        referredUser: buyerId,
        referredEmail: buyerEmail,
        course: course._id,
        amount: commission,
        status: 'pending',
        level,
      });

      parent.referralEarnings = (parent.referralEarnings || 0) + commission;
      if (level === 1) {
        parent.referralCount = (parent.referralCount || 0) + 1;
      }
      await parent.save();

      try {
        await sendEmail({
          to: parent.email,
          subject: 'Referral commission earned',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">You earned a referral commission</h2>
              <p><strong>${buyerEmail}</strong> purchased <strong>"${course.title}"</strong>.</p>
              <p><strong>Your level:</strong> ${level} (${pct}% of purchase amount)</p>
              <p><strong>Amount used for tiers:</strong> ₹${base}</p>
              <p><strong>Commission:</strong> ₹${commission}</p>
              <p><strong>Total referral earnings:</strong> ₹${parent.referralEarnings}</p>
            </div>
          `,
        });
      } catch (e) {
        console.error('Referrer commission email failed:', e);
      }
    }

    parentId = parent.referredBy;
  }
}
