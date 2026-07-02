'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import AnimatedSection from '../components/ui/AnimatedSection';
import EmptyState from '../components/ui/EmptyState';
import PrimaryButton from '../components/ui/PrimaryButton';
import SectionTitle from '../components/ui/SectionTitle';

function ProfileField({ label, value, mono = false, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children || (
        <div className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 ${
            mono ? 'font-mono text-sm' : ''
          }`}
        >
          {value || 'Not provided'}
        </div>
      )}
    </div>
  );
}

function ProfileCard({ children, className = '' }) {
  return (
    <div className={`dcc-card p-6 sm:p-8 hover:border-red-100/60 transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
}

function ProfileContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [referrals, setReferrals] = useState([]);
  const [hasCrmAccess, setHasCrmAccess] = useState(false);
  const [origin, setOrigin] = useState('');
  const [couponData, setCouponData] = useState(null);

  useEffect(() => {
    setOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      }
      const r = await fetch('/api/user/referrals');
      if (r.ok) {
        const d = await r.json();
        setReferrals(d.referrals || []);
      }

      const crmRes = await fetch('/api/user/crm-access');
      if (crmRes.ok) {
        const crmData = await crmRes.json();
        setHasCrmAccess(crmData.hasCrmAccess || false);
      }

      const cup = await fetch('/api/user/coupons');
      if (cup.ok) {
        setCouponData(await cup.json());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20">
      <PageHeader
        eyebrow="Account"
        title={`Welcome, ${session.user?.name || 'User'}!`}
        description="Manage your account and view your progress"
      >
        <PrimaryButton onClick={handleLogout} variant="secondary">
          Logout
        </PrimaryButton>
      </PageHeader>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {searchParams?.get('error') === 'crm-access-required' && (
          <AnimatedSection className="mb-8">
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">
                CRM access required. Please purchase a CRM course to access CRM features.
              </span>
            </div>
          </AnimatedSection>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <AnimatedSection>
              <ProfileCard>
                <SectionTitle
                  align="left"
                  title="Profile Information"
                  subtitle="Your account details"
                  className="mb-6 md:mb-8"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ProfileField label="Full Name" value={session.user?.name} />
                  <ProfileField label="Email" value={session.user?.email} />
                  {userData && (
                    <>
                      <ProfileField label="Mobile" value={userData.profile?.mobile} />
                      <ProfileField label="State" value={userData.profile?.state} />
                      {userData?.referralCode && (
                        <ProfileField label="Your referral code" value={userData.referralCode} mono />
                      )}
                      <ProfileField
                        label="Member Since"
                        value={new Date(userData.createdAt).toLocaleDateString()}
                      />
                    </>
                  )}
                </div>
              </ProfileCard>
            </AnimatedSection>

            {userData?.referralChain && userData.referralChain.length > 0 && (
              <AnimatedSection delay={0.05}>
                <ProfileCard>
                  <SectionTitle
                    align="left"
                    title="Referral chain (upline)"
                    subtitle="Locked at signup — level 1 is whoever referred you."
                    className="mb-6 md:mb-8"
                  />
                  <ul className="space-y-3">
                    {userData.referralChain.map((node) => (
                      <li
                        key={`${node.level}-${node.referralCode}`}
                        className="flex justify-between items-center text-sm px-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50"
                      >
                        <span className="text-slate-600 font-medium">Level {node.level}</span>
                        <span className="font-mono text-slate-900">{node.referralCode || '—'}</span>
                      </li>
                    ))}
                  </ul>
                </ProfileCard>
              </AnimatedSection>
            )}

            {couponData?.grouped && couponData.grouped.length > 0 && (
              <AnimatedSection delay={0.1}>
                <ProfileCard>
                  <SectionTitle
                    align="left"
                    title="My discount coupons"
                    className="mb-4 md:mb-6"
                  />
                  <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                    Not for signup referral — codes like <span className="font-mono">…P20…</span> are checkout discounts only. For inviting friends use <strong>Refer & earn</strong> below with your referral link.
                  </p>
                  <p className="text-sm text-slate-600 mb-6">
                    20% off gift coupons (30 days). <strong>Share codes or checkout links with friends only</strong> — you cannot use your own codes at checkout. Each code works once for whoever redeems it first.
                  </p>
                  <div className="space-y-6">
                    {couponData.grouped.map((g) => (
                      <div key={String(g.courseId)} className="border border-slate-100 rounded-xl p-5 bg-slate-50/30">
                        <h3 className="font-semibold text-slate-900 mb-4">{g.courseTitle}</h3>
                        <ul className="space-y-3">
                          {g.coupons.map((cp) => {
                            const fullLink =
                              origin && cp.sharePath ? `${origin}${cp.sharePath}` : cp.sharePath || '';
                            const daysLeft =
                              cp.expiresAt && cp.status === 'active'
                                ? Math.max(
                                    0,
                                    Math.ceil(
                                      (new Date(cp.expiresAt) - Date.now()) / (86400000)
                                    )
                                  )
                                : null;
                            const statusClass =
                              cp.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cp.status === 'used'
                                  ? 'bg-slate-200 text-slate-700'
                                  : cp.status === 'expired'
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-red-100 text-red-800';
                            return (
                              <li
                                key={cp._id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm px-4 py-3 rounded-xl border border-slate-100 bg-white"
                              >
                                <div>
                                  <span className="font-mono font-medium text-slate-900">{cp.code}</span>
                                  <span className="text-slate-600 ml-2">
                                    {cp.discountType === 'percent'
                                      ? `${cp.discountValue}% off`
                                      : `₹${cp.discountValue} off`}
                                  </span>
                                  {daysLeft != null && (
                                    <span className="block text-xs text-slate-500 mt-1">
                                      Expires in ~{daysLeft} day{daysLeft === 1 ? '' : 's'}
                                    </span>
                                  )}
                                  {cp.expiresAt && cp.status !== 'active' && (
                                    <span className="block text-xs text-slate-500 mt-1">
                                      Expires {new Date(cp.expiresAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-lg capitalize ${statusClass}`}
                                  >
                                    {cp.status}
                                  </span>
                                  {fullLink && cp.status === 'active' && (
                                    <PrimaryButton
                                      size="sm"
                                      variant="dark"
                                      onClick={() => {
                                        navigator.clipboard.writeText(fullLink);
                                        toast.success('Link copied — send to a friend (you cannot use your own codes)');
                                      }}
                                    >
                                      Copy checkout link
                                    </PrimaryButton>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ProfileCard>
              </AnimatedSection>
            )}

            <AnimatedSection delay={0.15}>
              <ProfileCard>
                <SectionTitle align="left" title="My Courses" className="mb-6 md:mb-8" />
                {userData?.courses && userData.courses.length > 0 ? (
                  <div className="space-y-3">
                    {userData.courses.map((course, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-red-100 transition-colors"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900">{course.courseName || 'Course'}</h3>
                          <p className="text-sm text-slate-600 mt-0.5">
                            Purchased: {new Date(course.purchasedAt).toLocaleDateString()}
                            {typeof course.progress === 'number' && (
                              <span className="ml-2 text-red-600 font-medium">· {course.progress}% complete</span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium capitalize ${
                            course.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : course.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {course.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No courses purchased yet"
                    description="Browse our catalog to start learning."
                    actionLabel="Browse Courses"
                    actionHref="/courses"
                  />
                )}
              </ProfileCard>
            </AnimatedSection>

            {userData?.referralCode && (
              <AnimatedSection delay={0.2}>
                <ProfileCard>
                  <SectionTitle
                    align="left"
                    title="Refer & earn"
                    subtitle="Share the signup link below so friends join under you (not discount coupon codes). Commissions: 35% direct, 10% level 2, 5% level 3 when they purchase."
                    className="mb-6 md:mb-8"
                  />
                  <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ProfileField label="Your Referral Code" value={userData?.referralCode} mono />
                    <ProfileField label="Share Link">
                      <input
                        readOnly
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition"
                        value={
                          origin && userData?.referralCode
                            ? `${origin}/signup?ref=${userData.referralCode}`
                            : ''
                        }
                      />
                    </ProfileField>
                  </div>

                  <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Referrals</div>
                      <div className="text-2xl font-bold text-red-600 mt-1">{userData?.referralCount || 0}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-center">
                      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Earnings</div>
                      <div className="text-2xl font-bold text-red-600 mt-1">₹{userData?.referralEarnings || 0}</div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-3">Referral Purchases</h3>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-slate-100 bg-slate-50/80">
                          <th className="py-3 px-4 font-semibold text-slate-700">Friend Email</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Course</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Level</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Amount</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Status</th>
                          <th className="py-3 px-4 font-semibold text-slate-700">Withdraw</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((r, idx) => (
                          <tr key={idx} className="border-b border-slate-50 last:border-0">
                            <td className="py-3 px-4 text-slate-800">{r.referredEmail}</td>
                            <td className="py-3 px-4 text-slate-800">{r.course?.title || '-'}</td>
                            <td className="py-3 px-4 text-slate-800">{r.level ?? 1}</td>
                            <td className="py-3 px-4 text-slate-800">₹{r.amount}</td>
                            <td className="py-3 px-4 capitalize text-slate-800">{r.status}</td>
                            <td className="py-3 px-4">
                              {r.status === 'paid' ? (
                                <PrimaryButton size="sm" disabled variant="secondary">
                                  Withdraw
                                </PrimaryButton>
                              ) : (
                                <PrimaryButton
                                  size="sm"
                                  href={`https://wa.me/917599863007?text=${encodeURIComponent(`Hi, I want to withdraw my referral earning ₹${r.amount} for friend ${r.referredEmail} (course: ${r.course?.title || ''}). My email: ${session?.user?.email}`)}`}
                                  external
                                  className="!bg-emerald-600 hover:!bg-emerald-700"
                                >
                                  Withdraw
                                </PrimaryButton>
                              )}
                            </td>
                          </tr>
                        ))}
                        {referrals.length === 0 && (
                          <tr>
                            <td className="py-8 px-4 text-slate-500 text-center" colSpan={6}>
                              No referral commissions yet. Share your signup link from the field above.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </ProfileCard>
              </AnimatedSection>
            )}
          </div>

          <div className="space-y-8">
            <AnimatedSection delay={0.05}>
              <ProfileCard>
                <SectionTitle align="left" title="Earnings Summary" className="mb-6" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <span className="text-slate-600">Total Earnings</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{userData?.referral?.totalEarnings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-slate-50/50 border border-slate-100">
                    <span className="text-slate-600">Pending Earnings</span>
                    <span className="font-semibold text-amber-600">
                      ₹{userData?.referral?.pendingEarnings || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="font-medium text-slate-900">Available Balance</span>
                    <span className="font-bold text-lg text-emerald-600">
                      ₹{(userData?.referral?.totalEarnings || 0) - (userData?.referral?.pendingEarnings || 0)}
                    </span>
                  </div>
                </div>
              </ProfileCard>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <ProfileCard>
                <SectionTitle align="left" title="Quick Actions" className="mb-6" />
                <div className="space-y-3">
                  {hasCrmAccess ? (
                    <>
                      <PrimaryButton onClick={() => router.push('/crm')} className="w-full" variant="dark">
                        Go to CRM Dashboard
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => router.push('/crm/referral-program')}
                        className="w-full !bg-emerald-600 hover:!bg-emerald-700"
                      >
                        Referral Program
                      </PrimaryButton>
                      <PrimaryButton
                        onClick={() => router.push('/crm/payment-center')}
                        className="w-full"
                        variant="secondary"
                      >
                        Payment Center
                      </PrimaryButton>
                    </>
                  ) : (
                    <EmptyState
                      title="CRM not unlocked"
                      description="Purchase a CRM course to access CRM features."
                      actionLabel="Browse Courses"
                      actionHref="/courses"
                    />
                  )}
                </div>
              </ProfileCard>
            </AnimatedSection>

            <AnimatedSection delay={0.15}>
              <ProfileCard>
                <SectionTitle align="left" title="Account Settings" className="mb-6" />
                <PrimaryButton
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/917417302165?text=${encodeURIComponent(`Hi, I want to delete my account. Email: ${session?.user?.email}`)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="w-full"
                >
                  Delete Account
                </PrimaryButton>
              </ProfileCard>
            </AnimatedSection>

            {userData?.referralCode && (
              <AnimatedSection delay={0.2}>
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 rounded-2xl shadow-lg p-6 sm:p-8 text-white border border-white/10">
                  <SectionTitle
                    align="left"
                    title="Your referral link"
                    className="mb-6 [&_h2]:text-white [&_p]:text-slate-300 [&>div]:bg-red-400"
                  />
                  <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-4 border border-white/10">
                    <code className="text-sm break-all text-slate-100">
                      {origin ? `${origin}/signup?ref=${userData.referralCode}` : 'Loading…'}
                    </code>
                  </div>
                  <PrimaryButton
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      const link = `${origin}/signup?ref=${userData.referralCode}`;
                      navigator.clipboard.writeText(link);
                      alert('Referral link copied to clipboard!');
                    }}
                  >
                    Copy referral link
                  </PrimaryButton>
                </div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-red-50/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
            <p className="mt-4 text-slate-600">Loading profile...</p>
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
