import User from '@/models/User';

/**
 * If this buyer has no referrer yet, attach the friend who shared the link
 * (signup_ref cookie) so their purchase pays that referral.
 */
export async function attachReferralFromCookie(user, request) {
  if (!user || user.referredBy) return user;

  let raw = '';
  try {
    raw = request?.cookies?.get?.('signup_ref')?.value || '';
  } catch {
    raw = '';
  }
  if (!raw) return user;

  let code = raw;
  try {
    code = decodeURIComponent(raw);
  } catch {
    code = raw;
  }
  const upper = String(code).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!upper) return user;

  const referrer = await User.findOne({ referralCode: upper }).select('_id email');
  if (!referrer) return user;
  if (String(referrer._id) === String(user._id)) return user;
  if (referrer.email && user.email && referrer.email === user.email) return user;

  user.referredBy = referrer._id;
  user.referralLocked = true;
  await user.save();
  return user;
}
