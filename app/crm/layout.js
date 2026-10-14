'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import { useCrmAccess } from '../hooks/useCrmAccess';
import './crm-theme.css';

function localUploadSrc(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return url;
  try {
    const path = new URL(url).pathname;
    if (path.startsWith('/uploads/')) return path;
  } catch {
    /* not an absolute url */
  }
  return url;
}

const NAV = [
  { href: '/crm', label: 'Dashboard', icon: '📊' },
  { href: '/crm/referral-program', label: 'Referral Link', icon: '🔗' },
  { href: '/crm/payment-center', label: 'My Payments', icon: '💳' },
  { href: '/crm/lead-add', label: 'Lead + Add', icon: '➕', badge: 'NEW' },
  { href: '/crm/training-videos', label: 'Training', icon: '🎥' },
  { href: '/crm/last-month-earnings', label: 'Last month earnings', icon: '📅' },
  { href: '/crm/data-store', label: 'Data Store', icon: '💾' },
  { href: '/crm/download-files', label: 'Marketing Tools', icon: '📣' },
  { href: '/crm/account-settings', label: 'KYC / Account', icon: '🪪' },
  { href: '/crm/support', label: 'Support', icon: '🆘' },
];

export default function CrmLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { hasCrmAccess, isLoading: checkingAccess } = useCrmAccess();
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [sidebarRevenue, setSidebarRevenue] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInputRef = useRef(null);

  useEffect(() => {
    if (session) {
      fetch('/api/user/profile')
        .then((res) => res.json())
        .then((data) => setUserData(data))
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/crm/dashboard')
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d && typeof d.todayEarning === 'number') {
          setSidebarRevenue({
            today: d.todayEarning,
            change: typeof d.todayEarningsChange === 'number' ? d.todayEarningsChange : 0,
          });
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (status === 'loading' || checkingAccess) return;
    if (!session) {
      router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
      return;
    }
    if (!checkingAccess && !hasCrmAccess) {
      router.push('/profile?error=crm-access-required');
    }
  }, [session, status, hasCrmAccess, checkingAccess, router, pathname]);

  const avatarSrc = localUploadSrc(userData?.profile?.avatar || session?.user?.image || '');

  const onProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.success || !uploadJson.url) {
        throw new Error(uploadJson.message || 'Upload failed');
      }
      const saveRes = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: { avatar: localUploadSrc(uploadJson.url) } }),
      });
      const saveJson = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveJson.message || 'Could not save photo');
      }
      setUserData((prev) => ({
        ...(prev || {}),
        profile: {
          ...(prev?.profile || {}),
          ...(saveJson.profile || {}),
          avatar: localUploadSrc(uploadJson.url),
        },
      }));
    } catch (err) {
      setPhotoError(err.message || 'Could not update photo');
    } finally {
      setPhotoBusy(false);
    }
  };

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  if (status === 'loading' || checkingAccess) {
    return (
      <div className="min-h-screen crm-main-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-700 rounded-full animate-spin" />
      </div>
    );
  }

  if (session && !checkingAccess && !hasCrmAccess) {
    return (
      <div className="min-h-screen crm-main-bg flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-lg font-semibold text-gray-900 mb-2">CRM access required</p>
          <p className="text-gray-600 mb-4">Purchase a course with CRM access to continue.</p>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="px-5 py-2.5 bg-violet-700 text-white rounded-lg font-medium"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  if (!session && status !== 'loading') return null;

  const displayName =
    userData?.profile?.firstName && userData?.profile?.lastName
      ? `${userData.profile.firstName} ${userData.profile.lastName}`
      : session?.user?.name || 'Member';

  return (
    <div className="min-h-screen flex crm-shell crm-main-bg">
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`crm-sidebar fixed md:relative text-white w-64 h-full z-50 shrink-0 transition-transform duration-300 shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <span className="font-bold text-lg tracking-tight">DCC CRM</span>
          <button
            type="button"
            className="md:hidden text-white/80 hover:text-white p-1"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="p-4 crm-profile-card rounded-xl mx-3 mt-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={photoBusy}
              className="relative shrink-0 w-20 h-20"
              aria-label="Add profile photo"
            >
              <span className="relative block w-full h-full rounded-full bg-violet-400/40 border-2 border-white/40 overflow-hidden">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="absolute inset-0 block h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-bold text-xl">
                    {getUserInitials()}
                  </span>
                )}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-yellow-300 text-gray-900 text-base font-bold flex items-center justify-center border-2 border-white">
                {photoBusy ? '…' : '+'}
              </span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={onProfilePhoto}
            />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{displayName}</p>
              <p className="text-xs text-white/70">Affiliate member</p>
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={photoBusy}
                className="mt-1 text-xs font-semibold text-yellow-300 hover:text-yellow-200"
              >
                {photoBusy ? 'Saving photo…' : avatarSrc ? 'Change photo' : 'Add photo'}
              </button>
            </div>
          </div>
          {photoError ? <p className="mt-2 text-[11px] text-red-200">{photoError}</p> : null}
          <div className="mt-3 pt-3 border-t border-white/15">
            <p className="text-[10px] uppercase tracking-wide text-white/60">Today</p>
            <p className="text-lg font-bold text-yellow-300">
              ₹{sidebarRevenue ? Math.round(sidebarRevenue.today).toLocaleString('en-IN') : '—'}
            </p>
          </div>
        </div>

        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-280px)]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active ? 'crm-nav-active' : 'crm-nav-item'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span className="flex-1 font-medium">{item.label}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-violet-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden px-3 py-2 border border-violet-200 rounded-lg text-violet-800"
              onClick={() => setIsOpen(true)}
            >
              ☰
            </button>
            <div>
              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                Welcome, {displayName.split(' ')[0]}
              </p>
              <p className="text-xs text-violet-600 font-mono">
                #{userData?.referralCode || session?.user?.referralCode || '—'}
              </p>
            </div>
          </div>
          <Link
            href="/courses"
            className="hidden sm:inline-flex text-sm font-medium text-violet-700 hover:text-violet-900"
          >
            Browse courses
          </Link>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
