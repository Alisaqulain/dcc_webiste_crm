'use client';

import { useState } from 'react';
import Head from 'next/head';

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [config, setConfig] = useState(null);

  const checkConfig = async () => {
    try {
      const response = await fetch('/api/check-config');
      const data = await response.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Failed to check config:', error);
    }
  };

  const handleTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmail) {
      alert('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/test-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        message: 'Network error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Test Email Configuration - Digital Career Center</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Test Email Configuration
            </h1>
            
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Setup Instructions:</h2>
              <ol className="text-blue-800 space-y-2 text-sm">
                <li>1. Create a <code className="bg-blue-100 px-1 rounded">.env.local</code> file in your project root</li>
                <li>2. Add your email configuration (see below)</li>
                <li>3. Use a valid email address for testing</li>
                <li>4. Click "Send Test Email" to verify the setup</li>
              </ol>
            </div>

            <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Configuration:</h3>
                <button
                  onClick={checkConfig}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                >
                  Check Config
                </button>
              </div>
              
              {config ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Admin Email:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      config.ADMIN_EMAIL === 'Not set' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {config.ADMIN_EMAIL}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email User:</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      config.EMAIL_USER === 'Not set' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {config.EMAIL_USER}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email Service:</span>
                    <span className="px-2 py-1 rounded text-sm bg-blue-100 text-blue-800">
                      {config.EMAIL_SERVICE}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-sm">Click "Check Config" to see current settings</p>
              )}
            </div>

            <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Required .env.local Configuration:</h3>
              <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
{`# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=Dcchelp1@gmail.com
EMAIL_PASS=your-app-password-here

# Admin Email (where contact form emails will be sent)
ADMIN_EMAIL=your-actual-email@gmail.com

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-here`}
              </pre>
              <p className="text-sm text-red-600 mt-2">
                ⚠️ Replace "your-actual-email@gmail.com" with your real email address!
              </p>
            </div>

            <form onSubmit={handleTestEmail} className="space-y-6">
              <div>
                <label htmlFor="testEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Test Email Address
                </label>
                <input
                  type="email"
                  id="testEmail"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter a valid email address (e.g., your-email@gmail.com)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Use your own email address to receive the test email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending Test Email...' : 'Send Test Email'}
              </button>
            </form>

            {result && (
              <div className={`mt-6 p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {result.success ? '✅ Success!' : '❌ Error'}
                </h3>
                <p className={`text-sm ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </p>
                {result.error && (
                  <details className="mt-2">
                    <summary className="text-sm font-medium cursor-pointer">
                      Technical Details
                    </summary>
                    <pre className="text-xs mt-2 p-2 bg-white rounded border overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Gmail App Password Setup:</h3>
              <ol className="text-yellow-800 space-y-2 text-sm">
                <li>1. Go to your Google Account settings</li>
                <li>2. Navigate to Security → 2-Step Verification</li>
                <li>3. Scroll down to "App passwords"</li>
                <li>4. Generate a new app password for "Mail"</li>
                <li>5. Use this 16-character password as EMAIL_PASS in .env.local</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
