'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AdminCouponsPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [courses, setCourses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  /** Page sections: admin bulk / site codes vs learner profile coupons */
  const [pageTab, setPageTab] = useState('admin');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [filterExpired, setFilterExpired] = useState('');

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkCourseId, setBulkCourseId] = useState('');
  const [bulkUsageLimit, setBulkUsageLimit] = useState('1');
  const [bulkExpires, setBulkExpires] = useState('');
  const defaultBulkRow = () => ({
    discountType: 'flat',
    discountValue: '100',
    count: '1',
  });
  const [bulkRows, setBulkRows] = useState([defaultBulkRow()]);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [learners, setLearners] = useState([]);
  const [learnersLoading, setLearnersLoading] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantDiscountTop, setGrantDiscountTop] = useState('percent');
  const [grantDiscountVal, setGrantDiscountVal] = useState('20');
  const [grantCount, setGrantCount] = useState('1');
  const [grantCourseId, setGrantCourseId] = useState('__ALL__');
  const [grantUsageLimit, setGrantUsageLimit] = useState('1');
  const [grantExpires, setGrantExpires] = useState('');
  const [filterOwnerId, setFilterOwnerId] = useState('');

  const authHeaders = useCallback(() => {
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('adminToken') : '');
    return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' };
  }, [token]);

  const loadCourses = useCallback(async () => {
    const t = localStorage.getItem('adminToken');
    if (!t) {
      router.push('/admin/login');
      return;
    }
    setToken(t);
    const res = await fetch('/api/admin/courses?limit=200&page=1', {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) {
      const list = data.courses || [];
      setCourses(list);
      setBulkCourseId((prev) => (prev !== undefined && prev !== null ? prev : ''));
    }
  }, [router]);

  const loadCoupons = useCallback(async () => {
    const t = localStorage.getItem('adminToken');
    if (!t) return;
    const params = new URLSearchParams();
    if (filterCourse === '__global__') {
      params.set('courseId', '__global__');
    } else if (filterCourse) {
      params.set('courseId', filterCourse);
    }
    params.set('createdBy', pageTab === 'admin' ? 'admin' : 'user');
    if (filterActive === 'true') params.set('active', 'true');
    if (filterActive === 'false') params.set('active', 'false');
    if (filterExpired === 'true') params.set('expired', 'true');
    if (filterExpired === 'false') params.set('expired', 'false');
    if (pageTab === 'learners' && filterOwnerId) params.set('ownerId', filterOwnerId);

    const res = await fetch(`/api/admin/coupons?${params}`, {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) {
      setCoupons(data.coupons || []);
    } else {
      toast.error(data.message || 'Failed to load coupons');
    }
    setLoading(false);
  }, [pageTab, filterCourse, filterActive, filterExpired, filterOwnerId]);

  const loadLearners = useCallback(async () => {
    const t = localStorage.getItem('adminToken');
    if (!t) return;
    setLearnersLoading(true);
    const res = await fetch('/api/admin/coupons/learners', {
      headers: { Authorization: `Bearer ${t}` },
    });
    const data = await res.json();
    if (res.ok) {
      setLearners(data.learners || []);
    } else {
      toast.error(data.message || 'Failed to load learners');
    }
    setLearnersLoading(false);
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    if (pageTab === 'learners') {
      loadLearners();
    }
  }, [pageTab, loadLearners]);

  const submitBulk = async (e) => {
    e.preventDefault();
    const batches = bulkRows
      .map((r) => ({
        discountType: r.discountType,
        discountValue: Number(r.discountValue),
        count: parseInt(r.count, 10) || 1,
      }))
      .filter((b) => b.discountValue >= 0 && b.count > 0);

    const isAllCourses = bulkCourseId === '__ALL__';
    const hasCourse = Boolean(bulkCourseId) && !isAllCourses;
    if ((!isAllCourses && !hasCourse) || batches.length === 0) {
      toast.error('Choose a specific course or "All courses", and add at least one batch');
      return;
    }

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        courseId: isAllCourses ? '__ALL__' : bulkCourseId,
        usageLimit: parseInt(bulkUsageLimit, 10) >= 0 ? parseInt(bulkUsageLimit, 10) : 1,
        expiresAt: bulkExpires || null,
        batches,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Created ${data.count} coupons`);
      setBulkOpen(false);
      loadCoupons();
    } else {
      toast.error(data.message || 'Create failed');
    }
  };

  const saveEdit = async () => {
    if (!editId) return;
    const { editCourseId, ownerEmail, ...rest } = editForm;
    const payload = {
      ...rest,
      courseId:
        editCourseId === '__ALL__' ? '__ALL__' : editCourseId,
      ownerEmail: ownerEmail !== undefined ? String(ownerEmail).trim() : undefined,
    };
    const res = await fetch(`/api/admin/coupons/${editId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Coupon updated');
      setEditId(null);
      loadCoupons();
      loadLearners();
    } else {
      toast.error(data.message || 'Update failed');
    }
  };

  const deleteCoupon = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      toast.success('Deleted');
      loadCoupons();
      loadLearners();
    } else {
      const d = await res.json();
      toast.error(d.message || 'Delete failed');
    }
  };

  const openEdit = (c) => {
    setEditId(c._id);
    const cid = c.courseId?._id || c.courseId;
    setEditForm({
      discountType: c.discountType,
      discountValue: c.discountValue,
      usageLimit: c.usageLimit,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '',
      isActive: c.isActive,
      isLocked: c.isLocked,
      editCourseId: cid ? String(cid) : '__ALL__',
      ownerEmail: c.ownerId?.email || '',
    });
  };

  const submitGrant = async (e) => {
    e.preventDefault();
    const email = String(grantEmail || '').trim();
    if (!email) {
      toast.error('Enter learner email');
      return;
    }
    const res = await fetch('/api/admin/coupons/grant-to-user', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        userEmail: email,
        discountType: grantDiscountTop,
        discountValue: Number(grantDiscountVal),
        count: parseInt(grantCount, 10) || 1,
        courseId: grantCourseId === '__ALL__' ? '__ALL__' : grantCourseId,
        usageLimit: parseInt(grantUsageLimit, 10) >= 0 ? parseInt(grantUsageLimit, 10) : 1,
        expiresAt: grantExpires || null,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success(`Granted ${data.count} user coupon(s)`);
      setGrantEmail('');
      loadCoupons();
      loadLearners();
    } else {
      toast.error(data.message || 'Grant failed');
    }
  };

  if (loading && coupons.length === 0) {
    return <div className="p-6">Loading…</div>;
  }

  const ownerLabel = (c) => {
    const p = c.ownerId?.profile;
    if (p) {
      const n = `${p.firstName || ''} ${p.lastName || ''}`.trim();
      if (n) return n;
    }
    return c.ownerId?.email || '—';
  };

  const filterBar = (
    <div className="flex flex-wrap gap-3 mb-4">
      <select
        value={filterCourse}
        onChange={(e) => setFilterCourse(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Every coupon</option>
        <option value="__global__">Global only (all courses)</option>
        {courses.map((c) => (
          <option key={c._id} value={c._id}>
            {c.title}
          </option>
        ))}
      </select>
      <select
        value={filterActive}
        onChange={(e) => setFilterActive(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Active + inactive</option>
        <option value="true">Active only</option>
        <option value="false">Inactive only</option>
      </select>
      <select
        value={filterExpired}
        onChange={(e) => setFilterExpired(e.target.value)}
        className="border rounded px-3 py-2 text-sm"
      >
        <option value="">Any expiry</option>
        <option value="true">Expired date passed</option>
        <option value="false">Not expired</option>
      </select>
      {pageTab === 'learners' && filterOwnerId && (
        <button
          type="button"
          onClick={() => setFilterOwnerId('')}
          className="border border-amber-300 bg-amber-50 px-3 py-2 rounded text-sm text-amber-900 hover:bg-amber-100"
        >
          Show all learners&apos; coupons
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          loadCoupons();
          if (pageTab === 'learners') loadLearners();
        }}
        className="border px-3 py-2 rounded text-sm hover:bg-gray-50"
      >
        Refresh
      </button>
    </div>
  );

  const couponsTable = (
    <div className="overflow-x-auto bg-white border rounded-lg">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b bg-gray-50">
            <th className="py-2 px-3">Code</th>
            <th className="py-2 px-3">Course</th>
            {pageTab === 'learners' && <th className="py-2 px-3">Learner</th>}
            <th className="py-2 px-3">Discount</th>
            <th className="py-2 px-3">Uses</th>
            <th className="py-2 px-3">Expires</th>
            <th className="py-2 px-3">Flags</th>
            <th className="py-2 px-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((c) => (
            <tr key={c._id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3 font-mono text-xs">{c.code}</td>
              <td className="py-2 px-3 max-w-[140px] truncate">
                {!c.courseId ? 'All courses' : c.courseId?.title || '—'}
              </td>
              {pageTab === 'learners' && (
                <td className="py-2 px-3 text-xs max-w-[120px]">
                  <span className="block truncate" title={ownerLabel(c)}>
                    {ownerLabel(c)}
                  </span>
                  {c.ownerId?.email && (
                    <span className="block text-[10px] text-gray-500 truncate" title={c.ownerId.email}>
                      {c.ownerId.email}
                    </span>
                  )}
                </td>
              )}
              <td className="py-2 px-3">
                {c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}
              </td>
              <td className="py-2 px-3">
                {c.usedCount}/{c.usageLimit === 0 ? '∞' : c.usageLimit}
              </td>
              <td className="py-2 px-3 text-xs">
                {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
              </td>
              <td className="py-2 px-3 text-xs">
                {c.isActive ? 'on' : 'off'} / {c.isLocked ? 'locked' : 'open'}
              </td>
              <td className="py-2 px-3 space-x-1 whitespace-nowrap">
                <button
                  type="button"
                  className="text-blue-600 hover:underline text-xs"
                  onClick={() => openEdit(c)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:underline text-xs"
                  onClick={() => deleteCoupon(c._id)}
                >
                  Del
                </button>
              </td>
            </tr>
          ))}
          {coupons.length === 0 && (
            <tr>
              <td
                colSpan={pageTab === 'learners' ? 8 : 7}
                className="py-8 text-center text-gray-500"
              >
                No coupons match filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <div className="mt-4 flex flex-wrap gap-2 border-b border-gray-200">
          <button
            type="button"
            className={`px-4 py-3 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
              pageTab === 'admin'
                ? 'border-red-600 text-red-700 bg-red-50/40'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => {
              setPageTab('admin');
              setFilterOwnerId('');
            }}
          >
            All coupons (admin)
          </button>
          <button
            type="button"
            className={`px-4 py-3 text-sm font-semibold rounded-t-lg border-b-2 -mb-px transition-colors ${
              pageTab === 'learners'
                ? 'border-green-600 text-green-800 bg-green-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => {
              setPageTab('learners');
              setFilterOwnerId('');
            }}
          >
            Learner coupons
          </button>
        </div>
      </div>

      {pageTab === 'admin' && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <p className="text-sm text-gray-600 max-w-3xl">
              Site-wide and course-specific codes for general checkout. Learner profile codes live on the other tab.
            </p>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 shrink-0"
            >
              Bulk create (admin)
            </button>
          </div>
          {filterBar}
          {couponsTable}
        </>
      )}

      {pageTab === 'learners' && (
        <>
          <p className="text-sm text-gray-600 mb-4 max-w-3xl">
            Profile coupons for one account: they appear on that user&apos;s profile and only work when that user is
            logged in at checkout. Grant codes, see who has redemptions, then edit or delete rows below.
          </p>

          <div className="bg-white border rounded-xl p-5 mb-6 shadow-sm">
            <h2 className="text-base font-bold mb-1">Grant coupons to a learner</h2>
            <p className="text-xs text-gray-500 mb-4">Use a registered email. Codes appear in their profile after you grant.</p>
            <form onSubmit={submitGrant} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium mb-1">Learner email</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded px-3 py-2"
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Applies to</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={grantCourseId}
                  onChange={(e) => setGrantCourseId(e.target.value)}
                >
                  <option value="__ALL__">All courses</option>
                  {courses.map((c) => (
                    <option key={c._id} value={String(c._id)}>
                      {c.title} only
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={grantDiscountTop}
                    onChange={(e) => setGrantDiscountTop(e.target.value)}
                  >
                    <option value="percent">Percent %</option>
                    <option value="flat">Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded px-3 py-2"
                    value={grantDiscountVal}
                    onChange={(e) => setGrantDiscountVal(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1"># Codes</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    className="w-full border rounded px-3 py-2"
                    value={grantCount}
                    onChange={(e) => setGrantCount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Uses / code</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full border rounded px-3 py-2"
                    value={grantUsageLimit}
                    onChange={(e) => setGrantUsageLimit(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry (optional)</label>
                <input
                  type="datetime-local"
                  className="w-full border rounded px-3 py-2 max-w-xs"
                  value={grantExpires}
                  onChange={(e) => setGrantExpires(e.target.value)}
                />
              </div>
              <button type="submit" className="bg-green-700 text-white px-6 py-2 rounded-lg hover:bg-green-800">
                Grant coupons
              </button>
            </form>
          </div>

          <div className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-lg font-bold">Learners with profile coupons</h2>
              <button
                type="button"
                onClick={() => loadLearners()}
                className="text-sm border px-3 py-1.5 rounded hover:bg-gray-50"
                disabled={learnersLoading}
              >
                {learnersLoading ? 'Loading…' : 'Refresh directory'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Names and usage: &quot;Redeemed&quot; means at least one of their codes was used at checkout.
            </p>
            <div className="overflow-x-auto border rounded-lg bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50">
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Email</th>
                    <th className="py-2 px-3">Codes</th>
                    <th className="py-2 px-3">Active</th>
                    <th className="py-2 px-3">Total uses</th>
                    <th className="py-2 px-3">Redeemed</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {learnersLoading && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!learnersLoading &&
                    learners.map((L) => (
                      <tr key={L.userId || L.email} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{L.name}</td>
                        <td className="py-2 px-3 text-xs break-all">{L.email}</td>
                        <td className="py-2 px-3">{L.couponCount}</td>
                        <td className="py-2 px-3">{L.activeCoupons}</td>
                        <td className="py-2 px-3">{L.totalUses}</td>
                        <td className="py-2 px-3">
                          {L.hasAnyRedemption ? (
                            <span className="text-green-700 font-medium">Yes ({L.couponsWithUse} code(s))</span>
                          ) : (
                            <span className="text-gray-500">No</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap space-x-1">
                          <button
                            type="button"
                            className="text-green-700 hover:underline text-xs"
                            disabled={!L.email || L.email.includes('(')}
                            title={
                              L.missingUser ? 'No account — enter a valid email above' : 'Prefill grant form'
                            }
                            onClick={() => {
                              if (L.email && !L.email.includes('(')) {
                                setGrantEmail(L.email);
                              }
                            }}
                          >
                            Grant more
                          </button>
                          <button
                            type="button"
                            className="text-blue-600 hover:underline text-xs"
                            disabled={!L.userId}
                            onClick={() => setFilterOwnerId(L.userId)}
                          >
                            Their codes only
                          </button>
                        </td>
                      </tr>
                    ))}
                  {!learnersLoading && learners.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No learners with profile coupons yet. Grant codes with the form above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-2">
            <h2 className="text-lg font-bold mb-1">All learner coupons</h2>
            <p className="text-xs text-gray-500 mb-3">
              {filterOwnerId
                ? 'Showing the selected learner\'s codes only. Use “Show all learners’ coupons” to widen the list.'
                : 'Every user-owned coupon.'}
            </p>
          </div>
          {filterBar}
          {couponsTable}
        </>
      )}

      {bulkOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">Bulk create (admin)</h2>
            <form onSubmit={submitBulk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Applies to</label>
                <select
                  required
                  value={bulkCourseId}
                  onChange={(e) => setBulkCourseId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select…</option>
                  <option value="__ALL__">All courses (site-wide)</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title} only
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Use &quot;All courses&quot; so the code works on any checkout. Pick one course to restrict it.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Usage limit / coupon</label>
                  <input
                    type="number"
                    min={0}
                    value={bulkUsageLimit}
                    onChange={(e) => setBulkUsageLimit(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry (optional)</label>
                  <input
                    type="datetime-local"
                    value={bulkExpires}
                    onChange={(e) => setBulkExpires(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Batches</label>
                <p className="text-xs text-gray-500 mb-2">
                  One row = one discount; Count is how many codes (use 1 for a single coupon). Add rows for different amounts.
                </p>
                {bulkRows.map((row, i) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-2 mb-2 p-2 rounded border border-gray-100 bg-gray-50/80"
                  >
                    <select
                      value={row.discountType}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[i].discountType = e.target.value;
                        setBulkRows(next);
                      }}
                      className="border rounded px-2 py-1"
                    >
                      <option value="flat">Flat ₹</option>
                      <option value="percent">Percent</option>
                    </select>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-24"
                      value={row.discountValue}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[i].discountValue = e.target.value;
                        setBulkRows(next);
                      }}
                    />
                    <input
                      type="number"
                      min={1}
                      className="border rounded px-2 py-1 w-20"
                      title="How many coupon codes for this discount"
                      value={row.count}
                      onChange={(e) => {
                        const next = [...bulkRows];
                        next[i].count = e.target.value;
                        setBulkRows(next);
                      }}
                    />
                    <span className="text-sm text-gray-500 self-center">coupons</span>
                    {bulkRows.length > 1 && (
                      <button
                        type="button"
                        className="text-sm text-red-600 hover:text-red-800 ml-auto sm:ml-0 px-2 py-1 rounded hover:bg-red-50"
                        onClick={() => setBulkRows(bulkRows.filter((_, idx) => idx !== i))}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-red-700 hover:text-red-900"
                  onClick={() => setBulkRows([...bulkRows, defaultBulkRow()])}
                >
                  + Add row
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-lg">
                  Create
                </button>
                <button
                  type="button"
                  className="flex-1 border py-2 rounded-lg"
                  onClick={() => setBulkOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-3">
            <h2 className="text-lg font-bold">Edit coupon</h2>
            <label className="block text-sm font-medium">Applies to</label>
            <select
              value={editForm.editCourseId || '__ALL__'}
              onChange={(e) =>
                setEditForm({ ...editForm, editCourseId: e.target.value })
              }
              className="w-full border rounded px-3 py-2"
            >
              <option value="__ALL__">All courses</option>
              {courses.map((co) => (
                <option key={co._id} value={String(co._id)}>
                  {co.title} only
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium">Learner email (user-owned)</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={editForm.ownerEmail ?? ''}
              onChange={(e) => setEditForm({ ...editForm, ownerEmail: e.target.value })}
              placeholder="Empty = admin coupon (anyone), or set email for user-only"
            />
            <p className="text-xs text-gray-500">
              Clearing email turns this into an admin coupon. Setting email assigns it to that account (type User).
            </p>
            <select
              value={editForm.discountType}
              onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="flat">Flat</option>
              <option value="percent">Percent</option>
            </select>
            <input
              type="number"
              className="w-full border rounded px-3 py-2"
              value={editForm.discountValue}
              onChange={(e) => setEditForm({ ...editForm, discountValue: Number(e.target.value) })}
            />
            <input
              type="number"
              min={0}
              className="w-full border rounded px-3 py-2"
              value={editForm.usageLimit}
              onChange={(e) => setEditForm({ ...editForm, usageLimit: parseInt(e.target.value, 10) })}
            />
            <input
              type="datetime-local"
              className="w-full border rounded px-3 py-2"
              value={editForm.expiresAt}
              onChange={(e) => setEditForm({ ...editForm, expiresAt: e.target.value })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.isActive}
                onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editForm.isLocked}
                onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
              />
              Locked
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="flex-1 border py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
