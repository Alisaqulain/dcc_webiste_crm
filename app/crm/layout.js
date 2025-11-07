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
	const [userData, setUserData] = useState(null);
	const [currentTime, setCurrentTime] = useState('');

	// Fetch user data
	useEffect(() => {
		if (session) {
			fetch('/api/user/profile')
				.then(res => res.json())
				.then(data => setUserData(data))
				.catch(err => console.error('Error fetching user data:', err));
		}
	}, [session]);

	// Update current time
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();
			const hours = now.getHours();
			const minutes = now.getMinutes();
			const ampm = hours >= 12 ? 'pm' : 'am';
			const displayHours = hours % 12 || 12;
			const displayMinutes = minutes.toString().padStart(2, '0');
			setCurrentTime(`${displayHours}:${displayMinutes}${ampm}`);
		};
		updateTime();
		const interval = setInterval(updateTime, 60000); // Update every minute
		return () => clearInterval(interval);
	}, []);

	// Get user initials
	const getUserInitials = () => {
		if (session?.user?.name) {
			const names = session.user.name.split(' ');
			return names.map(n => n[0]).join('').toUpperCase().slice(0, 2);
		}
		return 'U';
	};

	useEffect(() => {
		// Wait for session and access check to complete
		if (status === 'loading' || checkingAccess) return;
		
		// If no session, redirect to login
		if (!session) {
			// Use callbackUrl for NextAuth compatibility
			router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
			return;
		}

		// If session exists but no CRM access, redirect to profile with message
		// Only redirect if we've confirmed they don't have access (not still loading)
		if (!checkingAccess && !hasCrmAccess) {
			router.push('/profile?error=crm-access-required');
			return;
		}
	}, [session, status, hasCrmAccess, checkingAccess, router, pathname]);

	// Show loading state while checking session or access
	if (status === 'loading' || checkingAccess) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Checking access...</p>
				</div>
			</div>
		);
	}

	// Show loading if session exists but we're still verifying access
	// Only show error if we've confirmed they don't have access
	if (session && !checkingAccess && !hasCrmAccess) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<div className="text-red-600 text-2xl mb-4">⚠️</div>
					<p className="text-lg font-semibold text-gray-900 mb-2">Access Denied</p>
					<p className="text-gray-600 mb-4">You need to purchase a course with CRM access to use this feature.</p>
					<button
						onClick={() => router.push('/profile')}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Go to Profile
					</button>
				</div>
			</div>
		);
	}

	// If no session and not loading, redirect will happen in useEffect
	if (!session && status !== 'loading') {
		return null;
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
								<span className="text-white font-bold">{getUserInitials()}</span>
							</div>
							<div>
								<h1 className="font-semibold text-sm md:text-base text-gray-900">
									Welcome: {session?.user?.name?.toUpperCase() || 'User'}
								</h1>
								<p className="text-xs text-gray-500">
									Affiliate: #{userData?.referralCode || session?.user?.referralCode || 'N/A'}
								</p>
							</div>
						</div>
					</div>
					<div className="flex items-center gap-4">
						<div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
							<span className="w-2 h-2 bg-green-500 rounded-full"></span>
							<span>Server Time: {currentTime || new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
						</div>
						
					</div>
				</header>
				<main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">{children}</main>
			</div>
		</div>
	);
}


