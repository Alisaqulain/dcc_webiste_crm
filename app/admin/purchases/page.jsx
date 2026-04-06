'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPurchasesPage() {
  const router = useRouter();
  const [tab, setTab] = useState('log');
  const [purchases, setPurchases] = useState([]);
  const [byCourse, setByCourse] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [courseId, setCourseId] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [appliedCourseId, setAppliedCourseId] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const loadCourses = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    const res = await fetch('/api/admin/courses?limit=200&page=1', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setCourses(data.courses || []);
  }, []);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '50');
    if (appliedQ.trim()) params.set('q', appliedQ.trim());
    if (appliedCourseId) params.set('courseId', appliedCourseId);
    try {
      const res = await fetch(`/api/admin/purchases?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setPurchases(data.purchases || []);
      setByCourse(data.byCourse || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router, page, appliedQ, appliedCourseId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const applyFilters = (e) => {
    e?.preventDefault();
    setAppliedQ(q.trim());
    setAppliedCourseId(courseId);
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Course purchases</h1>
          <p className="text-sm text-gray-600 mt-1">
            Who bought which course, list price, amount paid, date, and coupon. New checkouts store exact paid INR;
            older rows show catalog price only until you rely on history.
          </p>
        </div>
        <button
          type="button"
          className="bg-gray-200 px-3 py-2 rounded text-sm hover:bg-gray-300"
          onClick={() => loadPurchases()}
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
        <button
          type="button"
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
            tab === 'log'
              ? 'border-red-600 text-red-700 bg-red-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setTab('log')}
        >
          Purchase log
        </button>
        <button
          type="button"
          className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 -mb-px ${
            tab === 'summary'
              ? 'border-red-600 text-red-700 bg-red-50/50'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setTab('summary')}
        >
          Summary by course
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
      )}

      {tab === 'log' && (
        <>
          <form
            onSubmit={applyFilters}
            className="flex flex-wrap gap-3 mb-4 items-end bg-white border rounded-lg p-4"
          >
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Search user</label>
              <input
                type="search"
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Name or email"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <div className="min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Course</label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
                <option value="">All courses</option>
                {courses.map((c) => (
                  <option key={c._id} value={String(c._id)}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
            >
              Apply
            </button>
          </form>

          {loading ? (
            <div>Loading…</div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">
                {total} purchase{total !== 1 ? 's' : ''} matching filters
                {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ''}
              </p>
              <div className="overflow-x-auto bg-white border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-2 px-3">Learner</th>
                      <th className="py-2 px-3">Email</th>
                      <th className="py-2 px-3">Course</th>
                      <th className="py-2 px-3">List (₹)</th>
                      <th className="py-2 px-3">Paid (₹)</th>
                      <th className="py-2 px-3">Coupon</th>
                      <th className="py-2 px-3">Purchased</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={`${p.userId}-${p.courseId}-${p.purchasedAt}`} className="border-b hover:bg-gray-50/80">
                        <td className="py-2 px-3 font-medium">{p.userName}</td>
                        <td className="py-2 px-3 text-xs">{p.email}</td>
                        <td className="py-2 px-3 max-w-[200px]">
                          <span className="line-clamp-2" title={p.courseTitle}>
                            {p.courseTitle}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          ₹{p.listPriceRupees}
                          {p.legacyPricing && (
                            <span className="block text-[10px] text-amber-700">at log / catalog</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {p.paidAmountRupees != null ? (
                            `₹${p.paidAmountRupees}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                          {p.legacyPricing && (
                            <span className="block text-[10px] text-gray-500">legacy row</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs">{p.couponLabel || '—'}</td>
                        <td className="py-2 px-3 text-xs whitespace-nowrap">
                          {p.purchasedAt
                            ? new Date(p.purchasedAt).toLocaleString()
                            : '—'}
                        </td>
                        <td className="py-2 px-3 text-xs capitalize">
                          {p.enrollmentStatus}
                          {p.progress != null ? ` · ${p.progress}%` : ''}
                        </td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">
                          No purchases match.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex gap-2 mt-4 justify-center">
                  <button
                    type="button"
                    disabled={page <= 1}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="text-sm py-1 px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {tab === 'summary' && (
        <>
          <p className="text-sm text-gray-600 mb-4">
            Enrollment counts per course. Revenue sum uses only purchases where paid amount was recorded.
          </p>
          {loading ? (
            <div>Loading…</div>
          ) : (
            <div className="overflow-x-auto bg-white border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-2 px-3">Course</th>
                    <th className="py-2 px-3">Purchases</th>
                    <th className="py-2 px-3">Rows with paid amount</th>
                    <th className="py-2 px-3">Sum paid (recorded ₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {byCourse.map((c) => (
                    <tr key={c.courseId || c.title} className="border-b">
                      <td className="py-2 px-3 font-medium">{c.title}</td>
                      <td className="py-2 px-3">{c.purchaseCount}</td>
                      <td className="py-2 px-3">{c.paidRows}</td>
                      <td className="py-2 px-3">₹{c.sumPaidRecorded.toFixed(0)}</td>
                    </tr>
                  ))}
                  {byCourse.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
