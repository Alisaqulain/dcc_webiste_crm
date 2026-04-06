import Referral from '@/models/Referral';
import { sendEmail } from '@/lib/email';

export const LEVEL_RATES = [0.35, 0.1, 0.05];

/**
 * Credit upline (up to 3 levels) on a course purchase. Uses buyer.referredBy chain.
 */
export async function distributePurchaseReferrals({
  buyerUser,
  course,
  User,
}) {
  const price = Number(course.price) || 0;
  if (price <= 0) return;

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

    const rate = LEVEL_RATES[level - 1];
    const commission = Math.round(price * rate);

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
              <p><strong>Your level:</strong> ${level} (${Math.round(rate * 100)}%)</p>
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
