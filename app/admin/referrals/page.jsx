'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReferralsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }
      const res = await fetch('/api/admin/referrals', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      setItems(data.referrals || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/referrals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Update failed');
      setItems(prev => prev.map(x => x._id === id ? data.referral : x));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Referrals</h1>
        <button className="bg-gray-200 px-3 py-2 rounded" onClick={load}>Reload</button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 px-3">Referrer</th>
                <th className="py-2 px-3">Friend</th>
                <th className="py-2 px-3">Course</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id} className="border-b">
                  <td className="py-2 px-3">{r.referrer?.email}</td>
                  <td className="py-2 px-3">{r.referredEmail}</td>
                  <td className="py-2 px-3">{r.course?.title}</td>
                  <td className="py-2 px-3">₹{r.amount}</td>
                  <td className="py-2 px-3 capitalize">{r.status}</td>
                  <td className="py-2 px-3 space-x-2">
                    {['pending','approved','paid','rejected'].map(s => (
                      <button
                        key={s}
                        onClick={() => updateStatus(r._id, s)}
                        className={`text-xs px-2 py-1 rounded ${r.status===s?'bg-gray-300':'bg-gray-100 hover:bg-gray-200'}`}
                      >{s}</button>
                    ))}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="py-4 px-3 text-gray-500" colSpan={6}>No referrals found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


