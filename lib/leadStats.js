/**
 * Aggregate lead counts for CRM user dashboard (lead-add sidebar).
 */
export function computeLeadStats(leads = []) {
  const list = Array.isArray(leads) ? leads : [];

  const accepted = list.filter(
    (l) => l.status === 'approved' || l.status === 'paid'
  ).length;
  const rejected = list.filter((l) => l.status === 'rejected').length;
  const pending = list.filter((l) => l.status === 'pending').length;

  const byEmail = new Map();
  const sorted = [...list].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
  let duplicates = 0;
  for (const lead of sorted) {
    const key = (lead.clientEmail || '').toLowerCase().trim();
    if (!key) continue;
    if (byEmail.has(key)) duplicates += 1;
    else byEmail.set(key, true);
  }

  const notLead = rejected + duplicates;

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);

  const acceptedThisMonth = list.filter((l) => {
    if (l.status !== 'approved' && l.status !== 'paid') return false;
    const d = new Date(l.approvedAt || l.updatedAt || l.createdAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const acceptedLastMonth = list.filter((l) => {
    if (l.status !== 'approved' && l.status !== 'paid') return false;
    const d = new Date(l.approvedAt || l.updatedAt || l.createdAt);
    return (
      d.getMonth() === lastMonthDate.getMonth() &&
      d.getFullYear() === lastMonthDate.getFullYear()
    );
  }).length;

  const acceptedMonthChange =
    acceptedLastMonth > 0
      ? (((acceptedThisMonth - acceptedLastMonth) / acceptedLastMonth) * 100).toFixed(0)
      : acceptedThisMonth > 0
        ? '100'
        : '0';

  return {
    accepted,
    rejected,
    duplicates,
    notLead,
    pending,
    total: list.length,
    acceptedThisMonth,
    acceptedMonthChange,
  };
}
