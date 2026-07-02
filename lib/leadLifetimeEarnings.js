import User from '@/models/User';

export function isEarningLeadStatus(status) {
  return status === 'approved' || status === 'paid';
}

/** Increment stored lifetime lead earnings when a lead first becomes payable. */
export async function incrementLifetimeLeadEarnings(userId, amount) {
  const amt = Number(amount) || 100;
  await User.findByIdAndUpdate(userId, { $inc: { lifetimeLeadEarnings: amt } });
}

/**
 * Keep stored lifetime total at least equal to visible approved/paid leads.
 * Handles users created before lifetime tracking and prevents TTL data loss.
 */
export async function syncLifetimeLeadEarnings(userId, currentLeadTotal) {
  const user = await User.findById(userId).select('lifetimeLeadEarnings').lean();
  if (!user) return 0;

  const stored = Number(user.lifetimeLeadEarnings) || 0;
  const current = Number(currentLeadTotal) || 0;

  if (current > stored) {
    await User.findByIdAndUpdate(userId, { lifetimeLeadEarnings: current });
    return current;
  }

  return stored;
}
