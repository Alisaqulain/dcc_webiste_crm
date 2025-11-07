'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CrmDashboard() {
	const { data: session } = useSession();
	const [dashboardData, setDashboardData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const response = await fetch('/api/crm/dashboard');
				if (response.ok) {
					const data = await response.json();
					setDashboardData(data);
				}
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (session) {
			fetchDashboardData();
		}
	}, [session]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const data = dashboardData || {
		totalLeads: 0,
		leadsChange: 0,
		totalEarning: 0,
		earningsChange: 0,
		todayEarning: 0,
		todayEarningsChange: 0,
		conversionRate: 0,
		conversionRateChange: 0,
		grandTotalEarning: 0,
		pendingWithdrawal: 0,
		recentLeads: []
	};

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
				<p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your business today.</p>
			</div>

			{/* Top KPI cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-600 mb-1">Total Leads</div>
							<div className="text-3xl font-bold text-gray-900">{data.totalLeads || 0}</div>
							<div className={`text-xs mt-1 ${data.leadsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
								{data.leadsChange >= 0 ? '+' : ''}{data.leadsChange.toFixed(1)}% from last month
							</div>
						</div>
						<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
							<span className="text-2xl">👥</span>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-600 mb-1">Total Earning</div>
							<div className="text-3xl font-bold text-gray-900">₹{data.totalEarning.toFixed(2) || '0.00'}</div>
							<div className={`text-xs mt-1 ${data.earningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
								{data.earningsChange >= 0 ? '+' : ''}{data.earningsChange.toFixed(1)}% from last month
							</div>
						</div>
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<span className="text-2xl">💰</span>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-600 mb-1">Today Earning</div>
							<div className="text-3xl font-bold text-green-600">₹{data.todayEarning.toFixed(2) || '0.00'}</div>
							<div className={`text-xs mt-1 ${data.todayEarningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
								{data.todayEarningsChange >= 0 ? '+' : ''}{data.todayEarningsChange.toFixed(1)}% from yesterday
							</div>
						</div>
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<span className="text-2xl">📈</span>
						</div>
					</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-sm font-medium text-gray-600 mb-1">Conversion Rate</div>
							<div className="text-3xl font-bold text-gray-900">{data.conversionRate.toFixed(1) || 0}%</div>
							<div className={`text-xs mt-1 ${data.conversionRateChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
								{data.conversionRateChange >= 0 ? '+' : ''}{data.conversionRateChange.toFixed(1)}% from last month
							</div>
						</div>
						<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
							<span className="text-2xl">🎯</span>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
				{/* Table */}
				<div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="p-6 border-b border-gray-200">
						<h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
						<p className="text-sm text-gray-600">Latest lead submissions and their status</p>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.R</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client Email</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{data.recentLeads && data.recentLeads.length > 0 ? (
									data.recentLeads.map((lead, i) => (
										<tr key={i} className="hover:bg-gray-50">
											<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.sr}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.date}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.clientEmail}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.service}</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.country}</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
													lead.status === 'approved' || lead.status === 'paid' 
														? 'bg-green-100 text-green-800'
														: lead.status === 'rejected'
														? 'bg-red-100 text-red-800'
														: 'bg-yellow-100 text-yellow-800'
												}`}>
													{lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
												</span>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
											No leads yet. Start referring to see your leads here!
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Right panel cards */}
				<div className="space-y-6">
					{/* Referral Earning - Commented out as requested */}
					{/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-sm font-medium text-gray-600">Referral Earning</h4>
							<span className="text-2xl">👥</span>
						</div>
						<div className="text-3xl font-bold text-gray-900">₹{data.referralEarning?.toFixed(2) || '0.00'}</div>
						<div className={`text-xs mt-1 ${data.referralEarningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
							{data.referralEarningsChange >= 0 ? '+' : ''}{data.referralEarningsChange?.toFixed(1) || 0}% from last month
						</div>
					</div> */}
					
					{/* Course Sale Earning - Commented out as requested */}
					{/* <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-sm font-medium text-gray-600">Course Sale Earning</h4>
							<span className="text-2xl">📚</span>
						</div>
						<div className="text-3xl font-bold text-gray-900">₹{data.courseSaleEarning?.toFixed(2) || '0.00'}</div>
						<div className={`text-xs mt-1 ${data.courseSaleEarningsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
							{data.courseSaleEarningsChange >= 0 ? '+' : ''}{data.courseSaleEarningsChange?.toFixed(1) || 0}% from last month
						</div>
					</div> */}
					
					<div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl shadow-sm p-6 text-white">
						<div className="flex items-center justify-between mb-4">
							<h4 className="text-sm font-medium">Grand Total Earning</h4>
							<span className="text-2xl">💰</span>
						</div>
						<div className="text-4xl font-extrabold">₹{data.grandTotalEarning.toFixed(2) || '0.00'}</div>
						<div className="text-xs opacity-90 mt-1">Total approved earnings</div>
						{data.pendingWithdrawal > 0 && (
							<div className="mt-3 pt-3 border-t border-yellow-300">
								<div className="text-xs opacity-90 mb-2">Pending Withdrawal: ₹{data.pendingWithdrawal.toFixed(2)}</div>
								<a
									href={`https://wa.me/917417302165?text=${encodeURIComponent(`Hi, I want to withdraw my lead earnings ₹${data.pendingWithdrawal.toFixed(2)}. My email: ${session?.user?.email || ''}`)}`}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-block w-full bg-white text-yellow-600 hover:bg-yellow-50 font-semibold py-2 px-4 rounded-lg transition-colors text-center text-sm"
								>
									Withdraw via WhatsApp
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Bottom course widgets */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Courses</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
					{[
						{ title: 'Tally prime Full Course', img: '/E1.png' },
						{ title: 'Web Designing Full Course', img: '/seo.png' },
						{ title: 'DSP Special Earning Course', img: '/dsp.png' },
						{ title: 'Tally prime Full Course', img: '/F1.png' },
						{ title: 'Web Designing Full Course', img: '/G1.png' },
					].map((course, idx) => (
						<div key={idx} className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer">
							<div className="h-24 w-full bg-white rounded-lg mb-3 flex items-center justify-center overflow-hidden shadow-sm">
								<img src={course.img} alt={course.title} className="h-full object-contain" />
							</div>
							<div className="text-sm font-semibold text-gray-900">{course.title}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}


