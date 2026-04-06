/**
 * Referral commission tiers: percent of the purchase amount (money the buyer paid).
 * Level 1 = direct referrer, 2 = their referrer, 3 = next up.
 */
export const REFERRAL_TIER_PERCENT = Object.freeze([35, 10, 5]);

export function referralPercentForLevel(level) {
  const i = Number(level) - 1;
  if (!Number.isInteger(i) || i < 0 || i >= REFERRAL_TIER_PERCENT.length) return 0;
  return REFERRAL_TIER_PERCENT[i];
}

/** Whole INR, rounded. */
export function referralCommissionRupees(baseRupees, level) {
  const pct = referralPercentForLevel(level);
  const base = Math.max(0, Number(baseRupees) || 0);
  if (!pct || !base) return 0;
  return Math.round((base * pct) / 100);
}
