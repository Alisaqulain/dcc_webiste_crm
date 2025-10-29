'use client';

export default function DemoPage() {
  const deploymentTime = new Date().toISOString();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 sm:p-12">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Deployment Successful! 🚀
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-8">
            Your code has been successfully deployed and is live.
          </p>

          {/* Info Card */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Deployment Information</h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                  LIVE
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">Deployed At:</span>
                <span className="text-gray-800 text-sm">
                  {new Date().toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 font-medium">UTC Time:</span>
                <span className="text-gray-800 text-sm font-mono">
                  {deploymentTime}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600 font-medium">Page:</span>
                <span className="text-gray-800 text-sm font-mono">
                  /demo
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              Go to Home
            </a>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-sm text-gray-500">
            If you can see this page, your deployment is working correctly! ✅
          </p>
        </div>
      </div>
    </div>
  );
}

