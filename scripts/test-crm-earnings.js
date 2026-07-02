/**
 * Unit tests for CRM earnings date-range vs lifetime calculations.
 * Run: npm run test:crm-earnings
 */

const assert = require('assert');
const {
  sumEarningsInRange,
  sumAllTimeEarnings,
  sumAllTimeLeadEarnings,
  getApprovedDate,
} = require('../lib/crmEarnings');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function todayRange() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
}

function makeLead({ daysBack, amount = 100, status = 'approved' }) {
  const approvedAt = daysAgo(daysBack);
  return {
    status,
    amount,
    approvedAt,
    createdAt: approvedAt,
    updatedAt: approvedAt,
  };
}

function makeReferral({ daysBack, amount = 50, status = 'approved' }) {
  const approvedAt = daysAgo(daysBack);
  return {
    status,
    amount,
    approvedAt,
    createdAt: approvedAt,
    updatedAt: approvedAt,
  };
}

const leads = [
  makeLead({ daysBack: 45, amount: 100 }),
  makeLead({ daysBack: 10, amount: 200 }),
  makeLead({ daysBack: 0, amount: 150 }),
  makeLead({ daysBack: 5, amount: 100, status: 'pending' }),
];

const referrals = [makeReferral({ daysBack: 40, amount: 75 })];

const { today, tomorrow } = todayRange();
const d7 = new Date(today);
d7.setDate(d7.getDate() - 7);
const d30 = new Date(today);
d30.setDate(d30.getDate() - 30);

// Last 30 days: 10-day (200) + today (150) = 350 leads; referrals none in range? 40 days ago = excluded
const last30 = sumEarningsInRange(leads, referrals, d30, tomorrow);
assert.strictEqual(last30, 350, 'last 30 days excludes earnings older than 30 days');

// All time from visible records: 100 + 200 + 150 = 450 leads + 75 referral = 525
const allTimeVisible = sumAllTimeEarnings(leads, referrals, 0);
assert.strictEqual(allTimeVisible, 525, 'all time sums every approved/paid record');

// Simulates TTL deleting a 45-day-old lead but lifetime counter retained on user
const leadsAfterTtl = leads.filter((l) => getApprovedDate(l) >= d30);
const allTimeWithLifetime = sumAllTimeEarnings(leadsAfterTtl, referrals, 450);
assert.strictEqual(
  allTimeWithLifetime,
  525,
  'all time stays at lifetime total after old lead rows are purged'
);

assert.strictEqual(
  sumAllTimeLeadEarnings(leadsAfterTtl, 450),
  450,
  'lifetime lead total never drops below stored counter'
);

const todayEarning = sumEarningsInRange(leads, referrals, today, tomorrow);
assert.strictEqual(todayEarning, 150, 'today only includes earnings from today');

const last7 = sumEarningsInRange(leads, referrals, d7, tomorrow);
assert.strictEqual(last7, 150, 'last 7 days excludes earnings older than 7 days');

console.log('All CRM earnings tests passed.');
