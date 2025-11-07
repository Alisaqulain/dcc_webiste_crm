'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ReferralProgramPage() {
	const { data: session } = useSession();
	const [referrals, setReferrals] = useState([]);
	const [userData, setUserData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [refRes, userRes] = await Promise.all([
					fetch('/api/user/referrals'),
					fetch('/api/user/profile')
				]);
				
				if (refRes.ok) {
					const refData = await refRes.json();
					setReferrals(refData.referrals || []);
				}
				
				if (userRes.ok) {
					const userData = await userRes.json();
					setUserData(userData);
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

	const copyReferralLink = () => {
		const link = `https://digitalcareercenter.com/signup?ref=${userData?.referralCode || ''}`;
		navigator.clipboard.writeText(link);
		alert('Referral link copied to clipboard!');
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	const acceptedCount = referrals.filter(r => r.status === 'approved' || r.status === 'paid').length;
	const pendingCount = referrals.filter(r => r.status === 'pending').length;
	const totalEarnings = referrals
		.filter(r => r.status === 'approved' || r.status === 'paid')
		.reduce((sum, r) => sum + (r.amount || 0), 0);

	return (
		<div className="space-y-6">
			<div className="bg-white border rounded-md p-4">
				<h2 className="text-lg font-semibold">Referral Program</h2>
				<p className="text-sm text-gray-600 mt-1">Invite friends and earn 50% commission when they purchase courses.</p>
				<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
					<div className="border rounded-md p-3">
						<div className="text-gray-700">Your Referral Link</div>
						<div className="mt-1 flex gap-2">
							<input 
								readOnly 
								className="flex-1 border rounded px-2 py-1 text-xs" 
								value={`https://digitalcareercenter.com/signup?ref=${userData?.referralCode || 'N/A'}`} 
							/>
							<button 
								onClick={copyReferralLink}
								className="px-3 py-1 rounded bg-gray-900 text-white hover:bg-gray-800"
							>
								Copy
							</button>
						</div>
						<div className="mt-2 text-xs text-gray-500">
							Your Referral Code: <span className="font-mono font-semibold">{userData?.referralCode || 'N/A'}</span>
						</div>
					</div>
					<div className="border rounded-md p-3">
						<div className="text-gray-700">Earnings Summary</div>
						<div className="mt-2 grid grid-cols-3 gap-2 text-center">
							<div className="rounded-md bg-green-100 p-3">
								<div className="text-xs">Accepted</div>
								<div className="text-2xl font-bold text-green-700">{acceptedCount}</div>
							</div>
							<div className="rounded-md bg-blue-100 p-3">
								<div className="text-xs">Pending</div>
								<div className="text-2xl font-bold text-blue-700">{pendingCount}</div>
							</div>
							<div className="rounded-md bg-yellow-100 p-3">
								<div className="text-xs">Total</div>
								<div className="text-2xl font-bold text-yellow-700">₹{totalEarnings.toFixed(2)}</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Referral Table */}
			<div className="bg-white border rounded-md overflow-hidden">
				<div className="p-4 border-b">
					<h3 className="font-semibold">Referral History</h3>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead className="bg-gray-100">
							<tr>
								<th className="p-2 text-left">Date</th>
								<th className="p-2 text-left">Friend Email</th>
								<th className="p-2 text-left">Course</th>
								<th className="p-2 text-left">Amount</th>
								<th className="p-2 text-left">Status</th>
							</tr>
						</thead>
						<tbody>
							{referrals.length > 0 ? (
								referrals.map((ref, i) => (
									<tr key={i} className="odd:bg-white even:bg-gray-50 border-b">
										<td className="p-2">{new Date(ref.createdAt).toLocaleDateString()}</td>
										<td className="p-2">{ref.referredEmail}</td>
										<td className="p-2">{ref.course?.title || '-'}</td>
										<td className="p-2 font-semibold">₹{ref.amount || 0}</td>
										<td className="p-2">
											<span className={`px-2 py-1 text-xs rounded-full ${
												ref.status === 'approved' || ref.status === 'paid' 
													? 'bg-green-100 text-green-800'
													: ref.status === 'rejected'
													? 'bg-red-100 text-red-800'
													: 'bg-yellow-100 text-yellow-800'
											}`}>
												{ref.status}
											</span>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan="5" className="p-4 text-center text-gray-500">No referrals yet</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>

		</div>
	);
}


