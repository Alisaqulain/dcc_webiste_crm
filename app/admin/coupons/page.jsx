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
  const [filterCourse, setFilterCourse] = useState('');
  const [filterCreatedBy, setFilterCreatedBy] = useState('');
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
      setBulkCourseId((prev) => prev || (list[0]?._id ?? ''));
    }
  }, [router]);

  const loadCoupons = useCallback(async () => {
    const t = localStorage.getItem('adminToken');
    if (!t) return;
    const params = new URLSearchParams();
    if (filterCourse) params.set('courseId', filterCourse);
    if (filterCreatedBy) params.set('createdBy', filterCreatedBy);
    if (filterActive === 'true') params.set('active', 'true');
    if (filterActive === 'false') params.set('active', 'false');
    if (filterExpired === 'true') params.set('expired', 'true');
    if (filterExpired === 'false') params.set('expired', 'false');

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
  }, [filterCourse, filterCreatedBy, filterActive, filterExpired]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const submitBulk = async (e) => {
    e.preventDefault();
    const batches = bulkRows
      .map((r) => ({
        discountType: r.discountType,
        discountValue: Number(r.discountValue),
        count: parseInt(r.count, 10) || 1,
      }))
      .filter((b) => b.discountValue >= 0 && b.count > 0);

    if (!bulkCourseId || batches.length === 0) {
      toast.error('Select course and add at least one batch');
      return;
    }

    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        courseId: bulkCourseId,
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
    const res = await fetch(`/api/admin/coupons/${editId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Coupon updated');
      setEditId(null);
      loadCoupons();
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
    } else {
      const d = await res.json();
      toast.error(d.message || 'Delete failed');
    }
  };

  const openEdit = (c) => {
    setEditId(c._id);
    setEditForm({
      discountType: c.discountType,
      discountValue: c.discountValue,
      usageLimit: c.usageLimit,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '',
      isActive: c.isActive,
      isLocked: c.isLocked,
    });
  };

  if (loading && coupons.length === 0) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Bulk create
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterCourse}
          onChange={(e) => setFilterCourse(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All courses</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>
              {c.title}
            </option>
          ))}
        </select>
        <select
          value={filterCreatedBy}
          onChange={(e) => setFilterCreatedBy(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="admin">Admin</option>
          <option value="user">User reward</option>
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
        <button
          type="button"
          onClick={() => loadCoupons()}
          className="border px-3 py-2 rounded text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto bg-white border rounded-lg">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">Code</th>
              <th className="py-2 px-3">Course</th>
              <th className="py-2 px-3">Type</th>
              <th className="py-2 px-3">Discount</th>
              <th className="py-2 px-3">Uses</th>
              <th className="py-2 px-3">Owner</th>
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
                  {c.courseId?.title || '—'}
                </td>
                <td className="py-2 px-3 capitalize">{c.createdBy}</td>
                <td className="py-2 px-3">
                  {c.discountType === 'percent' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                </td>
                <td className="py-2 px-3">
                  {c.usedCount}/{c.usageLimit === 0 ? '∞' : c.usageLimit}
                </td>
                <td className="py-2 px-3 text-xs">
                  {c.ownerId?.email || '—'}
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
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  No coupons match filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {bulkOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-bold mb-4">Bulk create (admin)</h2>
            <form onSubmit={submitBulk} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course</label>
                <select
                  required
                  value={bulkCourseId}
                  onChange={(e) => setBulkCourseId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select course</option>
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
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
