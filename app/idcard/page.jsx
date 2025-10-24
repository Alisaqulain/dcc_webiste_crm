'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ID Card Download Form Component
function IDCardDownloadForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rollNumber.trim()) {
      router.push(`/idcard/download/${rollNumber.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex gap-2">
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="Enter your roll number"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Download'}
        </button>
      </div>
    </form>
  );
}

export default function IDCardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Digital Career Center
          </h1>
          <h2 className="text-2xl text-gray-600 mb-2">
            Student ID Card
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Your official DCC student identification card. Keep this card with you during all DCC activities and courses.
          </p>
        </div>

        {/* ID Card Display */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
              <Image
                src="/id.jpg"
                alt="DCC Student ID Card"
                width={400}
                height={600}
                className="rounded-xl shadow-lg"
                priority
              />
            </div>
          </div>
        </div>

        {/* ID Card Information */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            ID Card Information
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Card Features:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                    Official DCC branding and logo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    QR code for quick verification
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                    Student photo placeholder
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                    Unique student identification
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Usage Instructions:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Present this card at DCC events and workshops
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Use for course access and verification
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Keep the QR code accessible for quick scanning
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Contact support if you need a replacement
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Download ID Card Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Download Your ID Card
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Enter your roll number to download your ID card
          </p>
          <IDCardDownloadForm />
        </div>

        {/* Download/Print Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-red-500 to-blue-600 rounded-xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Need a Physical Copy?
            </h3>
            <p className="mb-6 text-lg">
              Download and print your ID card for offline use
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Download PDF
              </button>
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Print Card
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}