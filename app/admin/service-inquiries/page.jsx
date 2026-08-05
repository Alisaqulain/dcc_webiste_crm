'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminPagination from '@/app/components/admin/AdminPagination';

const PAGE_SIZE = 50;

export default function AdminServiceInquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const authHeaders = useCallback(
    () => ({
      Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
      'Content-Type': 'application/json',
    }),
    []
  );

  const load = useCallback(async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (filter) params.set('status', filter);

      const res = await fetch(`/api/admin/service-inquiries?${params}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setInquiries(data.inquiries || []);
        setStats(data.stats || null);
        setPagination(data.pagination || null);
      }
    } finally {
      setLoading(false);
    }
  }, [router, filter, page, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    const res = await fetch('/api/admin/service-inquiries', {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) load();
  };

  const deleteInquiry = async (inq) => {
    if (!confirm(`Delete enquiry from "${inq.name}" (${inq.email})?`)) return;
    setDeletingId(inq._id);
    try {
      const res = await fetch(`/api/admin/service-inquiries?id=${inq._id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        return;
      }
      if (inquiries.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        load();
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && !inquiries.length) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Service enquiries</h1>
        <p className="text-sm text-gray-500 mt-1">
          Form submissions from service pages · {PAGE_SIZE} per page
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Total', stats.total],
            ['New', stats.new],
            ['Contacted', stats.contacted],
            ['Closed', stats.closed],
          ].map(([label, val]) => (
            <div key={label} className="bg-white border rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      )}

      <select
        className="border rounded-lg px-3 py-2 text-sm"
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All statuses</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 font-medium bg-gray-50">Date</th>
                <th className="text-left p-3 font-medium bg-gray-50">Service</th>
                <th className="text-left p-3 font-medium bg-gray-50">Name</th>
                <th className="text-left p-3 font-medium bg-gray-50">Contact</th>
                <th className="text-left p-3 font-medium bg-gray-50">Website</th>
                <th className="text-left p-3 font-medium bg-gray-50">Message</th>
                <th className="text-left p-3 font-medium bg-gray-50">Status</th>
                <th className="text-left p-3 font-medium bg-gray-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inquiries.map((inq) => (
                <tr key={inq._id} className="align-top hover:bg-gray-50/80">
                  <td className="p-3 whitespace-nowrap text-gray-500">
                    {new Date(inq.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">{inq.serviceTitle || '—'}</td>
                  <td className="p-3 font-medium">{inq.name}</td>
                  <td className="p-3">
                    <div>{inq.email}</div>
                    {inq.phone && <div className="text-gray-500">{inq.phone}</div>}
                  </td>
                  <td className="p-3 max-w-[140px] truncate" title={inq.websiteUrl || ''}>
                    {inq.websiteUrl || '—'}
                  </td>
                  <td className="p-3 max-w-[220px] text-gray-600 whitespace-pre-wrap break-words">
                    {inq.message || '—'}
                  </td>
                  <td className="p-3">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={inq.status}
                      onChange={(e) => updateStatus(inq._id, e.target.value)}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => deleteInquiry(inq)}
                      disabled={deletingId === inq._id}
                      className="text-red-600 hover:text-red-800 text-xs font-medium disabled:opacity-50 whitespace-nowrap"
                    >
                      {deletingId === inq._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {inquiries.length === 0 && (
            <p className="p-8 text-center text-gray-500 text-sm">No enquiries yet.</p>
          )}
        </div>

        {pagination && (
          <div className="border-t px-4 py-3 bg-gray-50">
            <AdminPagination
              pagination={pagination}
              page={page}
              onPageChange={setPage}
              label="enquiries"
            />
          </div>
        )}
      </div>
    </div>
  );
}
