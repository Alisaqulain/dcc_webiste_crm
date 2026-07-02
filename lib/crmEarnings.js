/** Shared earning calculations for CRM dashboard (leads + referrals). */

export function getApprovedDate(record) {
  if (record.approvedAt) return new Date(record.approvedAt);
  if (record.updatedAt) return new Date(record.updatedAt);
  if (record.createdAt) return new Date(record.createdAt);
  return null;
}

export function sumLeadsInRange(leads, from, to) {
  return leads
    .filter((l) => l.status === 'approved' || l.status === 'paid')
    .filter((l) => {
      const d = getApprovedDate(l);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d >= to) return false;
      return true;
    })
    .reduce((s, l) => s + (Number(l.amount) || 100), 0);
}

export function sumReferralsInRange(referrals, from, to) {
  return referrals
    .filter((r) => r.status === 'approved' || r.status === 'paid')
    .filter((r) => {
      const d = getApprovedDate(r);
      if (!d) return false;
      if (from && d < from) return false;
      if (to && d >= to) return false;
      return true;
    })
    .reduce((s, r) => s + (Number(r.amount) || 0), 0);
}

export function sumEarningsInRange(leads, referrals, from, to) {
  return (
    sumLeadsInRange(leads, from, to) + sumReferralsInRange(referrals, from, to)
  );
}

/** Lifetime lead earnings: never decreases when older lead rows are purged. */
export function sumAllTimeLeadEarnings(leads, lifetimeLeadEarnings = 0) {
  const currentTotal = sumLeadsInRange(leads, null, null);
  return Math.max(Number(lifetimeLeadEarnings) || 0, currentTotal);
}

/** Lifetime total (leads + referrals), no date filter. */
export function sumAllTimeEarnings(leads, referrals, lifetimeLeadEarnings = 0) {
  const leadTotal = sumAllTimeLeadEarnings(leads, lifetimeLeadEarnings);
  const referralTotal = sumReferralsInRange(referrals, null, null);
  return leadTotal + referralTotal;
}

export function buildDailySalesSeries(leads, referrals, daysBack = 365) {
  const map = new Map();
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  const add = (date, amount) => {
    if (!date || amount <= 0) return;
    const d = new Date(date);
    if (d < start || d > end) return;
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) || 0) + amount);
  };

  for (const l of leads) {
    if (l.status !== 'approved' && l.status !== 'paid') continue;
    add(getApprovedDate(l), Number(l.amount) || 100);
  }
  for (const r of referrals) {
    if (r.status !== 'approved' && r.status !== 'paid') continue;
    add(getApprovedDate(r), Number(r.amount) || 0);
  }

  const points = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    points.push({
      date: key,
      label: cursor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      amount: map.get(key) || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}
