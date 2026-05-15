const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthLabel(month) {
  const m = Number(month);
  if (m >= 1 && m <= 12) return MONTH_LABELS[m - 1];
  return '—';
}

export function feeRecordLabel(r) {
  if (!r) return '—';
  return `${monthLabel(r.month)} ${r.year}`;
}

export function computeFeeStatus(amountDue, amountPaid) {
  const due = Number(amountDue) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'pending';
  if (due > 0 && paid >= due) return 'paid';
  return 'partial';
}

export function sortFeeRecords(records = []) {
  return [...records].sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.month - a.month;
  });
}

export function enrichOfflineStudent(student) {
  const feeRecords = sortFeeRecords(student.feeRecords || []);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  let totalPaid = 0;
  let totalDue = 0;
  let monthsPaid = 0;
  let monthsPartial = 0;
  let monthsPending = 0;

  for (const r of feeRecords) {
    totalPaid += Number(r.amountPaid) || 0;
    totalDue += Number(r.amountDue) || 0;
    if (r.status === 'paid') monthsPaid += 1;
    else if (r.status === 'partial') monthsPartial += 1;
    else monthsPending += 1;
  }

  const currentRecord = feeRecords.find(
    (r) => r.year === currentYear && r.month === currentMonth
  );

  const lastRecord = feeRecords[0] || null;

  return {
    ...student,
    feeRecords,
    feeSummary: {
      totalPaid,
      totalDue,
      totalBalance: Math.max(0, totalDue - totalPaid),
      monthsPaid,
      monthsPartial,
      monthsPending,
      recordCount: feeRecords.length,
      currentYear,
      currentMonth,
      currentMonthLabel: monthLabel(currentMonth),
      currentStatus: currentRecord?.status || 'unpaid',
      currentRecord,
      lastRecord,
    },
  };
}

export function buildYearMonthGrid(feeRecords, year) {
  const y = Number(year);
  const byMonth = {};
  for (const r of feeRecords || []) {
    if (Number(r.year) === y) byMonth[r.month] = r;
  }
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const rec = byMonth[month];
    return {
      month,
      label: monthLabel(month),
      record: rec || null,
      status: rec?.status || 'unpaid',
    };
  });
}

export { MONTH_LABELS };
