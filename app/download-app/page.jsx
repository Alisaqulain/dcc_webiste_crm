"use client";
import React from "react";
import Image from "next/image";
import { FaDownload, FaMobile, FaDesktop, FaTablet, FaBell } from "react-icons/fa";

const DownloadApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            {/* Coming Soon Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-red-100 text-red-800 text-sm font-medium mb-8">
              <FaBell className="mr-2 animate-pulse" />
              Coming Soon
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Download Our
              <span className="block text-red-600">Mobile App</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Get access to all our courses, track your progress, and learn on the go with our 
              comprehensive mobile application. Available soon on all major platforms.
            </p>

            {/* App Preview */}
            <div className="relative mb-16">
              <div className="flex justify-center items-center space-x-4 sm:space-x-8">
                {/* Mobile Mockup */}
                <div className="relative">
                  <div className="w-48 h-96 sm:w-56 sm:h-[28rem] bg-gray-900 rounded-3xl p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                      <div className="text-center p-6">
                        <Image
                          src="/logo.jpg"
                          alt="DCC Logo"
                          width={80}
                          height={80}
                          className="rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">DCC Mobile</h3>
                        <p className="text-sm text-gray-600">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Mobile
                  </div>
                </div>

                {/* Tablet Mockup */}
                <div className="hidden sm:block relative">
                  <div className="w-64 h-80 bg-gray-900 rounded-2xl p-2 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                      <div className="text-center p-8">
                        <Image
                          src="/logo.jpg"
                          alt="DCC Logo"
                          width={100}
                          height={100}
                          className="rounded-full mx-auto mb-4"
                        />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">DCC Tablet</h3>
                        <p className="text-gray-600">Coming Soon</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Tablet
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMobile className="text-2xl text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Mobile Learning</h3>
                <p className="text-gray-600">
                  Learn anywhere, anytime with our mobile-optimized courses and offline capabilities.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaDesktop className="text-2xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cross-Platform</h3>
                <p className="text-gray-600">
                  Seamless experience across mobile, tablet, and desktop devices.
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-xl shadow-lg">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaDownload className="text-2xl text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Offline Access</h3>
                <p className="text-gray-600">
                  Download courses and learn without internet connection.
                </p>
              </div>
            </div>

            {/* Download Buttons Placeholder */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <div className="bg-gray-200 rounded-xl px-8 py-4 flex items-center space-x-3 opacity-60">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Download on the</div>
                  <div className="text-lg font-bold text-gray-800">App Store</div>
                </div>
              </div>
              
              <div className="bg-gray-200 rounded-xl px-8 py-4 flex items-center space-x-3 opacity-60">
                <div className="w-8 h-8 bg-gray-400 rounded"></div>
                <div>
                  <div className="text-sm font-medium text-gray-600">Get it on</div>
                  <div className="text-lg font-bold text-gray-800">Google Play</div>
                </div>
              </div>
            </div>

            {/* Notify Me Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Notified When We Launch</h3>
              <p className="text-gray-600 mb-6">
                Be the first to know when our mobile app is available for download.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-8 py-3 rounded-lg transition-colors">
                  Notify Me
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Mobile App?
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Experience learning like never before with our feature-rich mobile application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: "📱",
                title: "Mobile First",
                description: "Designed specifically for mobile learning experience"
              },
              {
                icon: "⚡",
                title: "Fast & Responsive",
                description: "Lightning-fast performance and smooth navigation"
              },
              {
                icon: "🔒",
                title: "Secure",
                description: "Your data and progress are always protected"
              },
              {
                icon: "🎯",
                title: "Personalized",
                description: "AI-powered recommendations and learning paths"
              },
              {
                icon: "📊",
                title: "Progress Tracking",
                description: "Monitor your learning journey with detailed analytics"
              },
              {
                icon: "💬",
                title: "Community",
                description: "Connect with fellow learners and instructors"
              },
              {
                icon: "🔔",
                title: "Notifications",
                description: "Never miss important updates and deadlines"
              },
              {
                icon: "🌐",
                title: "Offline Mode",
                description: "Continue learning even without internet connection"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of learners who are already preparing for the future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-white text-red-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Learning Now
            </a>
            <a
              href="/contact"
              className="border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-red-600 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadApp;
