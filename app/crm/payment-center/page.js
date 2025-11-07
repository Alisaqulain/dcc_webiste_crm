'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function PaymentCenterPage() {
	const { data: session } = useSession();
	const [dashboardData, setDashboardData] = useState(null);
	const [leads, setLeads] = useState([]);
	const [referrals, setReferrals] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [dashboardRes, leadsRes, refRes] = await Promise.all([
					fetch('/api/crm/dashboard'),
					fetch('/api/crm/leads'),
					fetch('/api/user/referrals')
				]);
				
				if (dashboardRes.ok) {
					const data = await dashboardRes.json();
					setDashboardData(data);
				}
				
				if (leadsRes.ok) {
					const data = await leadsRes.json();
					setLeads(data.leads || []);
				}
				
				if (refRes.ok) {
					const data = await refRes.json();
					setReferrals(data.referrals || []);
				}
			} catch (error) {
				console.error('Error fetching data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (session) {
			fetchData();
		}
	}, [session]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Calculate earnings
	const leadEarnings = leads
		.filter(l => l.status === 'approved' || l.status === 'paid')
		.reduce((sum, l) => sum + (l.amount || 100), 0);
	
	const referralEarnings = referrals
		.filter(r => r.status === 'approved' || r.status === 'paid')
		.reduce((sum, r) => sum + (r.amount || 0), 0);
	
	const grandTotal = leadEarnings + referralEarnings;

	// Get paid history (both leads and referrals with status 'paid')
	const paidHistory = [
		...leads.filter(l => l.status === 'paid').map(l => ({
			type: 'Lead',
			date: l.paidAt || l.updatedAt,
			amount: l.amount || 100,
			description: `${l.service} - ${l.clientEmail}`
		})),
		...referrals.filter(r => r.status === 'paid').map(r => ({
			type: 'Referral',
			date: r.updatedAt,
			amount: r.amount || 0,
			description: `${r.course?.title || 'Course'} - ${r.referredEmail}`
		}))
	].sort((a, b) => new Date(b.date) - new Date(a.date));

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="lg:col-span-2 bg-white border rounded-md p-4">
					<h2 className="text-lg font-semibold">Payment Center</h2>
					<p className="text-sm text-gray-600 mt-1">View balances and request withdrawals.</p>
					<div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
						<div className="rounded-md p-4 bg-gray-100">
							<div className="text-xs text-gray-600">Lead Earning</div>
							<div className="text-3xl font-bold">₹{leadEarnings.toFixed(2)}</div>
						</div>
						<div className="rounded-md p-4 bg-gray-100">
							<div className="text-xs text-gray-600">Referral Earning</div>
							<div className="text-3xl font-bold">₹{referralEarnings.toFixed(2)}</div>
						</div>
						<div className="rounded-md p-4 bg-yellow-100 border border-yellow-300">
							<div className="text-xs">Grand Total</div>
							<div className="text-3xl font-extrabold">₹{grandTotal.toFixed(2)}</div>
						</div>
					</div>

					{dashboardData?.pendingWithdrawal > 0 && (
						<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
							<div className="text-sm font-semibold text-blue-900 mb-2">Pending Withdrawal: ₹{dashboardData.pendingWithdrawal.toFixed(2)}</div>
							<a
								href={`https://wa.me/917417302165?text=${encodeURIComponent(`Hi, I want to withdraw my earnings ₹${dashboardData.pendingWithdrawal.toFixed(2)}. My email: ${session?.user?.email || ''}`)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
							>
								Withdraw via WhatsApp
							</a>
						</div>
					)}
				</div>

				<div className="bg-white border rounded-md p-4">
					<h3 className="font-semibold">Paid History</h3>
					<div className="mt-2 max-h-[500px] overflow-y-auto">
						{paidHistory.length > 0 ? (
							<table className="w-full text-sm">
								<thead className="bg-gray-100 sticky top-0">
									<tr>
										<th className="p-2 text-left">Date</th>
										<th className="p-2 text-left">Type</th>
										<th className="p-2 text-left">Amount</th>
									</tr>
								</thead>
								<tbody>
									{paidHistory.map((item, i) => (
										<tr key={i} className="odd:bg-white even:bg-gray-50 border-b">
											<td className="p-2 text-xs">{new Date(item.date).toLocaleDateString()}</td>
											<td className="p-2 text-xs">{item.type}</td>
											<td className="p-2 font-semibold">₹{item.amount.toFixed(2)}</td>
										</tr>
									))}
								</tbody>
							</table>
						) : (
							<div className="text-center py-8 text-gray-500 text-sm">No paid transactions yet</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
				{[
					{ title: 'Tally prime Full Course', img: '/E1.png' },
					{ title: 'Web Designing Full Course', img: '/seo.png' },
					{ title: 'DSP Special Earning Course', img: '/dsp.png' },
					{ title: 'Tally prime Full Course', img: '/F1.png' },
					{ title: 'Web Designing Full Course', img: '/G1.png' },
				].map((c, idx) => (
					<div key={idx} className="bg-white border rounded-md p-3 text-center">
						<div className="h-28 w-full bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
							<img src={c.img} alt={c.title} className="h-full object-contain" />
						</div>
						<div className="text-sm font-semibold">{c.title}</div>
					</div>
				))}
			</div>
		</div>
	);
}


