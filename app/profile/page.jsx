'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import toast from 'react-hot-toast';

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Error Message for CRM Access */}
        {searchParams?.get('error') === 'crm-access-required' && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              CRM access required. Please purchase a CRM course to access CRM features.
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {session.user?.name || 'User'}!
              </h1>
              <p className="text-gray-600">Manage your account and view your progress</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <p className="text-gray-900">{session.user?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900">{session.user?.email}</p>
                </div>
                {userData && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                      <p className="text-gray-900">{userData.profile?.mobile || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <p className="text-gray-900">{userData.profile?.state || 'Not provided'}</p>
                    </div>
                    {userData?.referralCode && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Your referral code</label>
                        <p className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded">
                          {userData.referralCode}
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                      <p className="text-gray-900">
                        {new Date(userData.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {userData?.referralChain && userData.referralChain.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Referral chain (upline)</h2>
                <p className="text-sm text-gray-600 mb-4">Locked at signup — level 1 is whoever referred you.</p>
                <ul className="space-y-2">
                  {userData.referralChain.map((node) => (
                    <li
                      key={`${node.level}-${node.referralCode}`}
                      className="flex justify-between text-sm border-b border-gray-100 pb-2"
                    >
                      <span className="text-gray-700">Level {node.level}</span>
                      <span className="font-mono text-gray-900">{node.referralCode || '—'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {couponData?.grouped && couponData.grouped.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">My coupons</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Reward coupons from your purchases (20% off, 30 days). Share the link to apply automatically at checkout.
                </p>
                <div className="space-y-6">
                  {couponData.grouped.map((g) => (
                    <div key={String(g.courseId)} className="border border-gray-100 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">{g.courseTitle}</h3>
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
                              ? 'bg-green-100 text-green-800'
                              : cp.status === 'used'
                                ? 'bg-gray-200 text-gray-700'
                                : cp.status === 'expired'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-800';
                          return (
                            <li
                              key={cp._id}
                              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-b border-gray-50 pb-3 last:border-0"
                            >
                              <div>
                                <span className="font-mono font-medium text-gray-900">{cp.code}</span>
                                <span className="text-gray-600 ml-2">
                                  {cp.discountType === 'percent'
                                    ? `${cp.discountValue}% off`
                                    : `₹${cp.discountValue} off`}
                                </span>
                                {daysLeft != null && (
                                  <span className="block text-xs text-gray-500 mt-1">
                                    Expires in ~{daysLeft} day{daysLeft === 1 ? '' : 's'}
                                  </span>
                                )}
                                {cp.expiresAt && cp.status !== 'active' && (
                                  <span className="block text-xs text-gray-500 mt-1">
                                    Expires {new Date(cp.expiresAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-xs font-medium px-2 py-1 rounded capitalize ${statusClass}`}
                                >
                                  {cp.status}
                                </span>
                                {fullLink && cp.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(fullLink);
                                      toast.success('Coupon link copied');
                                    }}
                                    className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                  >
                                    Copy link
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Courses */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Courses</h2>
              {userData?.courses && userData.courses.length > 0 ? (
                <div className="space-y-3">
                  {userData.courses.map((course, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.courseName || 'Course'}</h3>
                        <p className="text-sm text-gray-600">
                          Purchased: {new Date(course.purchasedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        course.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : course.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No courses purchased yet.</p>
              )}
            </div>

            {userData?.referralCode && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Refer & earn</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Commissions: 35% direct, 10% level 2, 5% level 3 on each referred purchase. Request payout from the table below (admin marks paid).
                </p>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Referral Code</label>
                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-gray-100 px-3 py-2 rounded text-gray-900">{userData?.referralCode || 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Share Link</label>
                    <input
                      readOnly
                      className="w-full border rounded px-3 py-2 text-sm"
                      value={
                        origin && userData?.referralCode
                          ? `${origin}/signup?ref=${userData.referralCode}`
                          : ''
                      }
                    />
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Total Referrals</div>
                    <div className="text-lg font-semibold">{userData?.referralCount || 0}</div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="text-xs text-gray-500">Total Earnings</div>
                    <div className="text-lg font-semibold">₹{userData?.referralEarnings || 0}</div>
                  </div>
                </div>

                <h3 className="font-semibold mb-2">Referral Purchases</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">Friend Email</th>
                        <th className="py-2 pr-4">Course</th>
                        <th className="py-2 pr-4">Level</th>
                        <th className="py-2 pr-4">Amount</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Withdraw</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referrals.map((r, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 pr-4">{r.referredEmail}</td>
                          <td className="py-2 pr-4">{r.course?.title || '-'}</td>
                          <td className="py-2 pr-4">{r.level ?? 1}</td>
                          <td className="py-2 pr-4">₹{r.amount}</td>
                          <td className="py-2 pr-4 capitalize">{r.status}</td>
                          <td className="py-2">
                            {r.status === 'paid' ? (
                              <button
                                disabled
                                className="text-gray-500 bg-gray-300 cursor-not-allowed px-3 py-1 rounded inline-block text-xs"
                              >Withdraw</button>
                            ) : (
                              <a
                                target="_blank"
                                rel="noreferrer"
                                href={`https://wa.me/917599863007?text=${encodeURIComponent(`Hi, I want to withdraw my referral earning ₹${r.amount} for friend ${r.referredEmail} (course: ${r.course?.title || ''}). My email: ${session?.user?.email}`)}`}
                                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded inline-block text-xs"
                              >Withdraw</a>
                            )}
                          </td>
                        </tr>
                      ))}
                      {referrals.length === 0 && (
                        <tr>
                          <td className="py-4 text-gray-500" colSpan={6}>No referral commissions yet. Share your signup link from the field above.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Earnings Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">
                    ₹{userData?.referral?.totalEarnings || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Earnings</span>
                  <span className="font-semibold text-yellow-600">
                    ₹{userData?.referral?.pendingEarnings || 0}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Available Balance</span>
                    <span className="font-bold text-lg text-green-600">
                      ₹{(userData?.referral?.totalEarnings || 0) - (userData?.referral?.pendingEarnings || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {hasCrmAccess ? (
                  <>
                    <button
                      onClick={() => router.push('/crm')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Go to CRM Dashboard
                    </button>
                    <button
                      onClick={() => router.push('/crm/referral-program')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Referral Program
                    </button>
                    <button
                      onClick={() => router.push('/crm/payment-center')}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Payment Center
                    </button>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Purchase a CRM course to access CRM features
                    </p>
                    <button
                      onClick={() => router.push('/courses')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Browse Courses
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Delete Account */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h3>
              <button
                onClick={() => {
                  const whatsappUrl = `https://wa.me/917417302165?text=${encodeURIComponent(`Hi, I want to delete my account. Email: ${session?.user?.email}`)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>

            {userData?.referralCode && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Your referral link</h3>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <code className="text-sm break-all">
                    {origin ? `${origin}/signup?ref=${userData.referralCode}` : 'Loading…'}
                  </code>
                </div>
                <button
                  onClick={() => {
                    const link = `${origin}/signup?ref=${userData.referralCode}`;
                    navigator.clipboard.writeText(link);
                    alert('Referral link copied to clipboard!');
                  }}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Copy referral link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
