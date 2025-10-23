'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const ReferralPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login?redirect=/referral');
      return;
    }

    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(user?.referralCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <p className="text-gray-600">Please try logging in again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Refer & Earn</h1>
            <p className="text-gray-600">Share your referral code and earn 10% commission on every course purchase!</p>
          </div>

          {/* Referral Code Section */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Code</h2>
            <div className="flex items-center justify-center space-x-4">
              <div className="bg-white px-6 py-3 rounded-lg border-2 border-red-200">
                <span className="text-2xl font-bold text-red-600">{user.referralCode}</span>
              </div>
              <button
                onClick={copyReferralCode}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Referral Link Section */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Link</h2>
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-white px-4 py-3 rounded-lg border border-gray-300">
                <span className="text-sm text-gray-600 break-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.referralCode}` : ''}
                </span>
              </div>
              <button
                onClick={copyReferralLink}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Earnings Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{user.referralEarnings || 0}
              </div>
              <div className="text-gray-600">Total Earnings</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {user.referralCount || 0}
              </div>
              <div className="text-gray-600">Successful Referrals</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">10%</div>
              <div className="text-gray-600">Commission Rate</div>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">1</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Share Your Code</h3>
                <p className="text-gray-600 text-sm">Share your referral code or link with friends and family</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">2</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">They Sign Up</h3>
                <p className="text-gray-600 text-sm">Your friends sign up using your referral code</p>
              </div>
              <div className="text-center">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-600 font-bold text-lg">3</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">You Earn</h3>
                <p className="text-gray-600 text-sm">Earn 10% commission when they purchase any course</p>
              </div>
            </div>
          </div>

          {/* Social Share Section */}
          <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share on Social Media</h3>
            <div className="flex justify-center space-x-4">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.referralCode}` : ''
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  `Join Digital Career Center and start your learning journey! Use my referral code: ${user.referralCode}`
                )}&url=${encodeURIComponent(
                  typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.referralCode}` : ''
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Twitter
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Join Digital Career Center and start your learning journey! Use my referral code: ${user.referralCode} - ${typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${user.referralCode}` : ''}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
