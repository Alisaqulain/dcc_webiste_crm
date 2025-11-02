'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useCrmAccess } from '../hooks/useCrmAccess';

export default function CrmLayout({ children }) {
	const pathname = usePathname();
	const router = useRouter();
	const { data: session, status } = useSession();
	const { hasCrmAccess, isLoading: checkingAccess } = useCrmAccess();
	const [isOpen, setIsOpen] = useState(true);

	useEffect(() => {
		if (status === 'loading' || checkingAccess) return;
		
		if (!session) {
			router.push('/login?redirect=' + pathname);
			return;
		}

		if (!hasCrmAccess) {
			router.push('/profile?error=crm-access-required');
			return;
		}
	}, [session, status, hasCrmAccess, checkingAccess, router, pathname]);

	if (status === 'loading' || checkingAccess || !hasCrmAccess) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Checking access...</p>
				</div>
			</div>
		);
	}

	const NavItem = ({ href, label, icon }) => {
		const active = pathname === href;
		return (
			<Link
				href={href}
				className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
					active 
						? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
						: 'text-gray-200 hover:bg-gray-700 hover:text-white'
				}`}
			>
				<span className="text-lg">{icon}</span>
				<span className="font-medium">{label}</span>
			</Link>
		);
	};

	return (
		<div className="min-h-screen flex bg-gray-100">
			{/* Mobile Overlay */}
			{isOpen && (
				<div 
					className="fixed inset-0  bg-opacity-50 z-40 md:hidden"
					onClick={() => setIsOpen(false)}
				/>
			)}
			
			{/* Sidebar */}
			<aside className={`fixed md:relative bg-gradient-to-b from-gray-900 to-gray-800 text-white w-64 h-full z-50 shrink-0 transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
				<div className="h-16 flex items-center justify-between px-6 border-b border-gray-700">
					<div className="flex items-center gap-3">
						<div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
							<span className="text-white font-bold text-sm">D</span>
						</div>
						<span className="font-bold text-sm md:text-base">DCC CRM</span>
					</div>
					<button className="md:hidden text-gray-300 hover:text-white p-1 rounded" onClick={() => setIsOpen(false)}>✕</button>
				</div>
				
				{/* Revenue Display */}
				<div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-green-600/20 to-green-500/20">
					<div className="text-xs text-gray-300 uppercase tracking-wide">Today&apos;s Revenue</div>
					<div className="text-2xl font-bold text-green-400">$0.00</div>
					<div className="text-xs text-gray-400 mt-1">+0% from yesterday</div>
				</div>
				
				<nav className="p-4 space-y-2 overflow-y-auto">
					<NavItem href="/crm" label="Dashboard" icon="📊" />
					<NavItem href="/crm/lead-add" label="Lead + Add" icon="➕" />
					<NavItem href="/crm/training-videos" label="Training Video&apos;s" icon="🎥" />
					<NavItem href="/crm/data-store" label="Data Store" icon="💾" />
					<NavItem href="/crm/referral-program" label="Referral Program" icon="👥" />
					<NavItem href="/crm/payment-center" label="Payment Center" icon="💳" />
					<NavItem href="/crm/account-settings" label="Account Settings" icon="⚙️" />
					<NavItem href="/crm/support" label="Support" icon="🆘" />
				</nav>
			</aside>

			{/* Main */}
			<div className="flex-1 min-w-0 flex flex-col bg-gray-50">
				<header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
					<div className="flex items-center gap-3">
						<button className="md:hidden px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors" onClick={() => setIsOpen(v => !v)}>
							<span className="text-lg">☰</span>
						</button>
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
								<span className="text-white font-bold">MA</span>
							</div>
							<div>
								<h1 className="font-semibold text-sm md:text-base text-gray-900">Welcome: MOHD ASIF K.</h1>
								<p className="text-xs text-gray-500">Affiliate: #220575</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
							<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							<span>Server Time: 5:09am</span>
						</div>
						
					</div>
				</header>
				<main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">{children}</main>
			</div>
		</div>
	);
}


