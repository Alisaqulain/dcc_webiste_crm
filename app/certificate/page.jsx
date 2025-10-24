'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Certificate Download Form Component
function CertificateDownloadForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rollNumber.trim()) {
      router.push(`/certificate/download/${rollNumber.trim()}`);
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

export default function CertificatePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Certificate
          </h1>
          <div className="w-24 sm:w-32 h-1 sm:h-2 bg-red-600 mx-auto mb-6"></div>
          <p className="text-lg sm:text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
            Digital Career Center provides industry-recognized certificates upon successful completion of our courses. 
            These certificates validate your skills and enhance your professional credibility.
          </p>
        </div>

        {/* Certificate Display Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Digital Career Center Certificate
            </h2>
            <p className="text-gray-600 text-lg">
              Industry-Recognized Professional Certification
            </p>
          </div>

          {/* Certificate Image Container */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 sm:p-6 shadow-inner">
              <div className="relative w-full h-auto">
                <Image
                  src="/certificate1.jpg"
                  alt="Digital Career Center Certificate"
                  width={800}
                  height={600}
                  className="w-full h-auto rounded-lg shadow-lg"
                  priority
                />
              </div>
            </div>
            
            {/* Certificate Details */}
            <div className="mt-8 text-center">
              <div className="bg-red-50 border-l-4 border-red-600 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                  Certificate Features
                </h3>
                <ul className="text-sm sm:text-base text-gray-700 space-y-2">
                  <li className="flex items-center justify-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Industry-recognized certification</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Validates your digital skills</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Enhances professional credibility</span>
                  </li>
                  <li className="flex items-center justify-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Boosts career opportunities</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
          {/* Left Column - Benefits */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              Why Our Certificate Matters
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Industry Recognition</h4>
                  <p className="text-gray-600 text-sm">Our certificates are recognized by leading companies and help you stand out in the job market.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Skill Validation</h4>
                  <p className="text-gray-600 text-sm">Proves your competency in digital marketing and related technologies to potential employers.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Career Advancement</h4>
                  <p className="text-gray-600 text-sm">Opens doors to better job opportunities and higher salary prospects.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - How to Get Certificate */}
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
              How to Earn Your Certificate
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Enroll in Course</h4>
                  <p className="text-gray-600 text-sm">Choose from our comprehensive course packages that match your career goals.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Complete Training</h4>
                  <p className="text-gray-600 text-sm">Attend all sessions, complete assignments, and participate in live projects.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Pass Assessment</h4>
                  <p className="text-gray-600 text-sm">Successfully complete the final assessment to demonstrate your skills.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Receive Certificate</h4>
                  <p className="text-gray-600 text-sm">Get your industry-recognized certificate and boost your professional profile.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Download Certificate Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Download Your Certificate
          </h3>
          <p className="text-gray-600 text-center mb-6">
            Enter your roll number to download your certificate
          </p>
          <CertificateDownloadForm />
        </div>

        {/* Call to Action Section */}
        <div className="text-center mt-12 sm:mt-16">
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 sm:p-12 text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to Earn Your Certificate?
            </h3>
            <p className="text-lg sm:text-xl mb-8 opacity-90">
              Join thousands of students who have already earned their Digital Career Center certification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/BronzeBundle"
                className="bg-white text-red-600 font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors duration-300 transform hover:scale-105"
              >
                View Courses
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white font-bold px-8 py-4 rounded-lg hover:bg-white hover:text-red-600 transition-colors duration-300 transform hover:scale-105"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}