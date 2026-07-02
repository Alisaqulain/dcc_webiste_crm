'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '@/app/components/admin/ConfirmDialog';

const PAGE_SIZE = 50;

function formatLeadDate(value) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: PAGE_SIZE,
    hasNext: false,
    hasPrev: false,
  });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchSummary, setSearchSummary] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (debouncedSearch) params.set('search', debouncedSearch);
      const res = await fetch(`/api/admin/leads?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setItems(data.leads || []);
      if (data.pagination) setPagination(data.pagination);
      setSearchSummary(data.searchSummary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router, page, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Update failed');
      toast.success('Lead updated');
      setItems((prev) => prev.map((x) => (x._id === id ? data.lead : x)));
    } catch (e) {
      toast.error(e.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/leads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: deleteTarget._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      toast.success('Lead deleted');
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const pageNumbers = () => {
    const total = pagination.totalPages || 1;
    const windowSize = 5;
    let start = Math.max(1, page - 2);
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    const nums = [];
    for (let i = start; i <= end; i++) nums.push(i);
    return nums;
  };

  return (
    <div className="p-4 md:p-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Leads</h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} total · pending/rejected auto-removed ~30 days after creation
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="shrink-0 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Reload
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by user email (who submitted leads), client email, name, or mobile..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <p className="mt-1.5 text-xs text-gray-500">
          User email daal kar dekhein us bande ne kitne leads bheje — jaise Users page par search hota hai.
        </p>
      </div>

      {debouncedSearch && searchSummary && !loading && (
        <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-950 space-y-3">
          <div>
            <p className="font-semibold">
              {searchSummary.total} lead{searchSummary.total === 1 ? '' : 's'} matching &quot;{debouncedSearch}&quot;
            </p>
            <p className="mt-1 text-violet-800">
              Approved: {searchSummary.approved} · Paid: {searchSummary.paid} · Pending:{' '}
              {searchSummary.pending} · Rejected: {searchSummary.rejected}
            </p>
          </div>
          {searchSummary.userBreakdown?.length > 0 && (
            <div className="border-t border-violet-200/80 pt-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
                Leads submitted by user
              </p>
              {searchSummary.userBreakdown.map((row) => (
                <div
                  key={row.email}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white/70 rounded-lg px-3 py-2 border border-violet-100"
                >
                  <div>
                    <span className="font-medium text-gray-900">{row.email}</span>
                    {row.name && <span className="text-gray-600"> · {row.name}</span>}
                  </div>
                  <div className="text-violet-900 font-semibold">
                    {row.total} lead{row.total === 1 ? '' : 's'} total
                    <span className="font-normal text-violet-700 text-xs ml-2">
                      (✓{row.approved} · ₹{row.paid} paid · ⏳{row.pending} · ✗{row.rejected})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading leads…</div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="w-full table-fixed divide-y divide-gray-200">
              <colgroup>
                <col className="w-[9%]" />
                <col className="w-[18%]" />
                <col className="w-[18%]" />
                <col className="w-[22%]" />
                <col className="w-[6%]" />
                <col className="w-[10%]" />
                <col className="w-[17%]" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Created
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Submitted by
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Client email
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Service · Country
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    ₹
                  </th>
                  <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-gray-600 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {items.map((lead) => {
                  const created = formatLeadDate(lead.createdAt || lead.date);
                  return (
                    <tr
                      key={lead._id}
                      className="hover:bg-red-50/40 transition-colors duration-150 align-top"
                    >
                      <td className="px-2 py-2.5 text-xs text-gray-700 leading-snug">
                        <span className="block font-medium">{created.date}</span>
                        {created.time && <span className="block text-gray-500">{created.time}</span>}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 break-all leading-snug">
                        {lead.user?.email || '—'}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 break-all leading-snug">
                        {lead.clientEmail}
                      </td>
                      <td className="px-2 py-2.5 text-xs text-gray-700 leading-snug">
                        <span className="block break-words" title={lead.service}>
                          {lead.service}
                        </span>
                        <span className="block text-gray-500 mt-0.5">{lead.country}</span>
                      </td>
                      <td className="px-2 py-2.5 text-xs font-semibold text-gray-900">
                        ₹{lead.amount ?? 100}
                      </td>
                      <td className="px-2 py-2.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                            lead.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'paid'
                                ? 'bg-blue-100 text-blue-800'
                                : lead.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <div className="flex flex-wrap justify-end gap-x-2 gap-y-1 text-[11px] leading-tight">
                          {lead.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(lead._id, 'approved')}
                              className="text-green-700 hover:text-green-900 font-medium whitespace-nowrap"
                            >
                              Approve
                            </button>
                          )}
                          {lead.status === 'approved' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(lead._id, 'paid')}
                              className="text-blue-700 hover:text-blue-900 font-medium whitespace-nowrap"
                            >
                              Paid
                            </button>
                          )}
                          {lead.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => updateStatus(lead._id, 'rejected')}
                              className="text-amber-700 hover:text-amber-900 font-medium whitespace-nowrap"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(lead)}
                            className="text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {items.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                {debouncedSearch
                  ? `No leads found for "${debouncedSearch}".`
                  : 'No leads on this page.'}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} leads)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {pageNumbers().map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    n === page
                      ? 'bg-red-600 text-white shadow'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNext}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete lead"
        message={
          deleteTarget
            ? `Remove this lead permanently? ${deleteTarget.clientEmail} · ${deleteTarget.service}`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
