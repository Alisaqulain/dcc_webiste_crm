'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCheckUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const checkUser = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const res = await fetch(`/api/admin/check-user?email=${encodeURIComponent(email)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Failed to check user');
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Check User Purchases</h1>
        <button
          className="bg-gray-200 px-3 py-2 rounded"
          onClick={() => router.push('/admin/users')}
        >
          Back to Users
        </button>
      </div>

      <div className="bg-white border rounded p-6 mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            placeholder="Enter user email (e.g., dcchelp1@gmail.com)"
            className="flex-1 border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && checkUser()}
          />
          <button
            onClick={checkUser}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check User'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {result && (
        <div className="bg-white border rounded overflow-x-auto">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-2">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm text-gray-500">Email</span>
                <p className="font-medium">{result.user.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Name</span>
                <p className="font-medium">{result.user.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Total Courses</span>
                <p className="font-medium">{result.user.totalCourses}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Purchased Courses</h2>
            {result.courses.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 px-3">Course Title</th>
                    <th className="py-2 px-3">Videos</th>
                    <th className="py-2 px-3">Purchased Date</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {result.courses.map((course, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-2 px-3 font-medium">{course.courseTitle}</td>
                      <td className="py-2 px-3">{course.videoCount} videos</td>
                      <td className="py-2 px-3">
                        {new Date(course.purchasedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 px-3 capitalize">{course.status}</td>
                      <td className="py-2 px-3">{course.progress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                This user has not purchased any courses yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
