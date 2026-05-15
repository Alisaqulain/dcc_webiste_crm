'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import CrmEarningCards from '../components/crm/CrmEarningCards';
import CrmSalesChart from '../components/crm/CrmSalesChart';
import './crm-theme.css';

export default function CrmDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('affiliate');

  useEffect(() => {
    if (!session) return;
    fetch('/api/crm/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDashboardData(data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [session]);

  if (isLoading) {
    return (
      <div className="crm-main-bg min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-violet-200 border-t-violet-700 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-violet-800 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const data = dashboardData || {
    todayEarning: 0,
    last7DaysEarning: 0,
    last30DaysEarning: 0,
    allTimeEarning: 0,
    salesSeries: [],
    recentLeads: [],
    pendingWithdrawal: 0,
    grandTotalEarning: 0,
  };

  return (
    <div className="crm-main-bg space-y-6 -m-4 sm:-m-6 p-4 sm:p-6 min-h-full">
      <div className="flex flex-wrap gap-6 border-b border-violet-200/80 pb-1">
        {[
          { id: 'affiliate', label: 'Affiliate' },
          { id: 'membership', label: 'Membership' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-semibold transition-colors ${
              activeTab === tab.id ? 'crm-tab-active' : 'text-gray-500 hover:text-violet-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <CrmEarningCards data={data} />

      <CrmSalesChart salesSeries={data.salesSeries || []} />

      {data.pendingWithdrawal > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 p-5 text-gray-900 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold">Pending withdrawal</p>
            <p className="text-2xl font-bold">₹{Number(data.pendingWithdrawal).toFixed(2)}</p>
          </div>
          <a
            href={`https://wa.me/917599863007?text=${encodeURIComponent(
              `Hi, I want to withdraw my lead earnings ₹${data.pendingWithdrawal.toFixed(2)}. My email: ${session?.user?.email || ''}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white px-5 py-2.5 rounded-lg font-semibold text-amber-900 hover:bg-amber-50 shadow"
          >
            Withdraw via WhatsApp
          </a>
        </div>
      )}

      <div className="rounded-2xl border border-violet-200/50 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-violet-950">Recent leads</h3>
            <p className="text-sm text-gray-500">Latest submissions</p>
          </div>
          <Link
            href="/crm/lead-add"
            className="text-sm font-semibold text-violet-700 hover:text-violet-900"
          >
            + Add lead
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-violet-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-800 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-800 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-800 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-800 uppercase">Service</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-violet-800 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data.recentLeads || []).length > 0 ? (
                data.recentLeads.map((lead, i) => (
                  <tr key={i} className="hover:bg-violet-50/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{lead.sr}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.date}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.clientEmail}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.service}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          lead.status === 'approved' || lead.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : lead.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                    No leads yet. Share your referral link or add a lead.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
