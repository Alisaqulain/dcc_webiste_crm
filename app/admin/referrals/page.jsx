'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { referralPercentForLevel } from '@/lib/referralRates';
import AdminPagination from '@/app/components/admin/AdminPagination';

const PAGE_SIZE = 50;

const emptyPagination = {
  total: 0,
  totalPages: 1,
  limit: PAGE_SIZE,
  page: 1,
  hasNext: false,
  hasPrev: false,
};

function personLabel(u) {
  if (!u) return '—';
  const n = [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(' ').trim();
  return n || u.email || '—';
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const [tab, setTab] = useState('commissions');
  const [items, setItems] = useState([]);
  const [underGroups, setUnderGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [commissionPage, setCommissionPage] = useState(1);
  const [networkPage, setNetworkPage] = useState(1);
  const [commissionPagination, setCommissionPagination] = useState(emptyPagination);
  const [networkPagination, setNetworkPagination] = useState(emptyPagination);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  });

  const loadCommissions = useCallback(
    async (opts = {}) => {
      const silent = Boolean(opts.silent);
      if (!silent) setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }
        const params = new URLSearchParams({
          page: String(commissionPage),
          limit: String(PAGE_SIZE),
        });
        const res = await fetch(`/api/admin/referrals?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load');
        setItems(data.referrals || []);
        if (data.pagination) setCommissionPagination(data.pagination);
      } catch (e) {
        setError(e.message);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [router, commissionPage]
  );

  const loadNetwork = useCallback(async () => {
    setNetworkLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      const params = new URLSearchParams({
        page: String(networkPage),
        limit: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/admin/referrals/network?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setUnderGroups(data.underByReferrer || []);
      if (data.pagination) setNetworkPagination(data.pagination);
      setExpandedId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setNetworkLoading(false);
    }
  }, [router, networkPage]);

  useEffect(() => {
    loadCommissions();
  }, [loadCommissions]);

  useEffect(() => {
    if (tab === 'under') {
      loadNetwork();
    }
  }, [tab, loadNetwork]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/referrals', {
        method: 'PUT',
        headers: { ...authHeaders(), Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Update failed');
      await loadCommissions({ silent: true });
    } catch (e) {
      alert(e.message);
    }
  };

  const switchTab = (next) => {
    setTab(next);
    setError('');
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <button
          type="button"
          className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
          onClick={() => {
            loadCommissions();
            if (tab === 'under') loadNetwork();
          }}
        >
          Reload
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
            tab === 'commissions'
              ? 'border-red-600 text-red-700 bg-red-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => switchTab('commissions')}
        >
          Commission rows
        </button>
        <button
          type="button"
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
            tab === 'under'
              ? 'border-red-600 text-red-700 bg-red-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => switchTab('under')}
        >
          Under each referrer
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      {tab === 'commissions' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Payout lines use <strong>35% / 10% / 5%</strong> of the buyer’s <em>paid</em> amount (not list price when a coupon
            applied). Approve or mark paid here. Showing {PAGE_SIZE} rows per page.
          </p>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto bg-white border rounded">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-2 px-3">Referrer</th>
                      <th className="py-2 px-3">Friend (buyer)</th>
                      <th className="py-2 px-3">Course</th>
                      <th className="py-2 px-3">Level</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((r) => (
                      <tr key={r._id} className="border-b hover:bg-gray-50/80">
                        <td className="py-2 px-3">
                          <span className="font-medium">{personLabel(r.referrer)}</span>
                          <span className="block text-xs text-gray-500">{r.referrer?.email}</span>
                          {r.referrer?.referralCode && (
                            <span className="block text-[10px] text-gray-400 font-mono">{r.referrer.referralCode}</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium">{personLabel(r.referredUser)}</span>
                          <span className="block text-xs text-gray-500">{r.referredEmail}</span>
                        </td>
                        <td className="py-2 px-3">{r.course?.title}</td>
                        <td className="py-2 px-3">
                          L{r.level ?? 1}{' '}
                          <span className="text-gray-500">({referralPercentForLevel(r.level ?? 1)}%)</span>
                        </td>
                        <td className="py-2 px-3">₹{r.amount}</td>
                        <td className="py-2 px-3 capitalize">{r.status}</td>
                        <td className="py-2 px-3 space-x-1">
                          {['pending', 'approved', 'paid', 'rejected'].map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => updateStatus(r._id, s)}
                              className={`text-xs px-2 py-1 rounded ${
                                r.status === s ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td className="py-4 px-3 text-gray-500" colSpan={7}>
                          No referral commission rows on this page.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                pagination={commissionPagination}
                page={commissionPage}
                onPageChange={setCommissionPage}
                label="commission rows"
              />
            </>
          )}
        </>
      )}

      {tab === 'under' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Direct signups grouped by referrer ({PAGE_SIZE} referrers per page). Expand a row to see everyone who used
            their link or code.
          </p>
          {networkLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="space-y-4">
                {underGroups.map((g) => {
                  const open = expandedId === g.referrerId;
                  return (
                    <div key={g.referrerId} className="bg-white border rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full text-left px-4 py-3 flex flex-wrap items-center justify-between gap-2 bg-gray-50 hover:bg-gray-100 border-b"
                        onClick={() => setExpandedId(open ? null : g.referrerId)}
                      >
                        <div>
                          <div className="font-semibold text-gray-900">{g.referrer.name}</div>
                          <div className="text-xs text-gray-600">{g.referrer.email}</div>
                          <div className="text-xs font-mono text-gray-500 mt-0.5">
                            Code: {g.referrer.referralCode || '—'}
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          <div>
                            <span className="text-gray-500">Under them: </span>
                            <span className="font-bold text-red-700">{g.directCount}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Tracked earnings ₹{Number(g.referrer.referralEarnings || 0).toFixed(0)} · direct purchases #
                            {g.referrer.referralCount ?? 0}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">{open ? 'Hide list ▲' : 'Show signups ▼'}</div>
                        </div>
                      </button>
                      {open && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left border-b bg-white">
                                <th className="py-2 px-3">Name</th>
                                <th className="py-2 px-3">Email</th>
                                <th className="py-2 px-3">Joined</th>
                                <th className="py-2 px-3">Active</th>
                              </tr>
                            </thead>
                            <tbody>
                              {g.referrals.map((u) => (
                                <tr key={u.userId} className="border-b last:border-0">
                                  <td className="py-2 px-3">{u.name}</td>
                                  <td className="py-2 px-3 text-xs">{u.email}</td>
                                  <td className="py-2 px-3 text-xs">
                                    {u.joinedAt ? new Date(u.joinedAt).toLocaleString() : '—'}
                                  </td>
                                  <td className="py-2 px-3 text-xs">{u.isActive ? 'Yes' : 'No'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
                {underGroups.length === 0 && (
                  <div className="p-8 text-center text-gray-500 bg-white border rounded">
                    No referred users on this page.
                  </div>
                )}
              </div>
              <AdminPagination
                pagination={networkPagination}
                page={networkPage}
                onPageChange={setNetworkPage}
                label="referrers"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
