'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Code</label>
                      <p className="text-gray-900 font-mono bg-gray-100 px-3 py-1 rounded">
                        {userData.referral?.code || 'Not available'}
                      </p>
                    </div>
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
              </div>
            </div>

            {/* Referral Link */}
            {userData?.referral?.code && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-semibold mb-3">Your Referral Link</h3>
                <div className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <code className="text-sm break-all">
                    {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/signup?ref={userData.referral.code}
                  </code>
                </div>
                <button
                  onClick={() => {
                    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/signup?ref=${userData.referral.code}`;
                    navigator.clipboard.writeText(link);
                    alert('Referral link copied to clipboard!');
                  }}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Copy Referral Link
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


