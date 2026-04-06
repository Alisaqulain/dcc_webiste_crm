'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function LastMonthEarningsPage() {
	const { data: session } = useSession();
	const [data, setData] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (!session) return;
		const load = async () => {
			try {
				const res = await fetch('/api/crm/dashboard');
				if (res.ok) {
					const json = await res.json();
					setData(json);
				}
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [session]);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-[40vh]">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
			</div>
		);
	}

	const label = data?.previousMonthLabel || 'Last month';
	const amount = Number(data?.previousMonthEarning) || 0;
	const leads = data?.previousMonthLeadCount ?? 0;

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Last month earnings</h1>
				<p className="text-gray-600 mt-1 text-sm">
					Full previous calendar month from approved lead commissions. The{' '}
					<Link href="/crm" className="text-blue-600 hover:underline font-medium">
						Dashboard
					</Link>{' '}
					only highlights the current month.
				</p>
			</div>

			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
				<div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</div>
				<div className="text-4xl font-extrabold text-gray-900 mt-2">₹{amount.toFixed(2)}</div>
				<div className="text-sm text-gray-600 mt-4">
					Approved leads counted in this month:{' '}
					<span className="font-semibold text-gray-900">{leads}</span>
				</div>
			</div>
		</div>
	);
}
