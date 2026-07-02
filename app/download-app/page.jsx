"use client";

import React from "react";
import Image from "next/image";
import { FaDownload, FaMobile, FaDesktop, FaBell } from "react-icons/fa";
import PageHeader from "@/app/components/ui/PageHeader";
import AnimatedSection from "@/app/components/ui/AnimatedSection";
import SectionTitle from "@/app/components/ui/SectionTitle";
import PrimaryButton from "@/app/components/ui/PrimaryButton";

const features = [
  { icon: "📱", title: "Mobile First", description: "Designed specifically for mobile learning experience" },
  { icon: "⚡", title: "Fast & Responsive", description: "Lightning-fast performance and smooth navigation" },
  { icon: "🔒", title: "Secure", description: "Your data and progress are always protected" },
  { icon: "🎯", title: "Personalized", description: "AI-powered recommendations and learning paths" },
  { icon: "📊", title: "Progress Tracking", description: "Monitor your learning journey with detailed analytics" },
  { icon: "💬", title: "Community", description: "Connect with fellow learners and instructors" },
  { icon: "🔔", title: "Notifications", description: "Never miss important updates and deadlines" },
  { icon: "🌐", title: "Offline Mode", description: "Continue learning even without internet connection" },
];

const DownloadApp = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        dark
        eyebrow="Mobile Learning"
        title={
          <>
            Download Our
            <span className="block text-red-400 mt-1">Mobile App</span>
          </>
        }
        description="Get access to all our courses, track your progress, and learn on the go. Available soon on all major platforms."
      >
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium">
          <FaBell className="animate-pulse text-red-300" />
          Coming Soon
        </span>
      </PageHeader>

      <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex justify-center items-center gap-6 sm:gap-10 mb-16">
          <div className="relative">
            <div className="w-44 sm:w-52 h-[22rem] sm:h-[26rem] bg-slate-900 rounded-[2rem] p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-[1.5rem] flex items-center justify-center">
                <div className="text-center p-6">
                  <Image
                    src="/newlogo.jpeg"
                    alt="Digital Career Center"
                    width={220}
                    height={80}
                    className="mx-auto mb-4 h-14 sm:h-16 w-auto object-contain"
                  />
                  <h3 className="text-base font-bold text-slate-900 mb-1">DCC Mobile</h3>
                  <p className="text-sm text-slate-500">Coming Soon</p>
                </div>
              </div>
            </div>
            <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              Mobile
            </span>
          </div>

          <div className="hidden sm:block relative">
            <div className="w-56 h-72 bg-slate-900 rounded-2xl p-2 shadow-2xl">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                <div className="text-center p-8">
                  <Image
                    src="/newlogo.jpeg"
                    alt="Digital Career Center"
                    width={260}
                    height={92}
                    className="mx-auto mb-4 h-16 sm:h-20 w-auto object-contain"
                  />
                  <h3 className="text-lg font-bold text-slate-900 mb-1">DCC Tablet</h3>
                  <p className="text-slate-500 text-sm">Coming Soon</p>
                </div>
              </div>
            </div>
            <span className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              Tablet
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: <FaMobile className="text-2xl text-red-600" />,
              title: "Mobile Learning",
              description: "Learn anywhere, anytime with mobile-optimized courses and offline capabilities.",
            },
            {
              icon: <FaDesktop className="text-2xl text-blue-600" />,
              title: "Cross-Platform",
              description: "Seamless experience across mobile, tablet, and desktop devices.",
            },
            {
              icon: <FaDownload className="text-2xl text-emerald-600" />,
              title: "Offline Access",
              description: "Download courses and learn without an internet connection.",
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="text-center p-6 sm:p-8 dcc-card-hover"
            >
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 opacity-60">
          <div className="bg-white border border-slate-200 rounded-xl px-8 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="text-left">
              <div className="text-xs font-medium text-slate-500">Download on the</div>
              <div className="text-base font-bold text-slate-800">App Store</div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl px-8 py-4 flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 bg-slate-200 rounded-lg" />
            <div className="text-left">
              <div className="text-xs font-medium text-slate-500">Get it on</div>
              <div className="text-base font-bold text-slate-800">Google Play</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-2xl mx-auto">
          <SectionTitle
            title="Get Notified at Launch"
            subtitle="Be the first to know when our mobile app is available for download."
            className="mb-6 [&_h2]:text-2xl"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 dcc-input text-sm"
            />
            <PrimaryButton size="lg">Notify Me</PrimaryButton>
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection className="bg-white border-y border-slate-100 py-16 md:py-20" delay={0.05}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Why Choose Our Mobile App?"
            subtitle="Experience learning like never before with our feature-rich mobile application."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200 hover:border-red-100 hover:shadow-md transition-all duration-300"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 py-16 md:py-20"
        delay={0.1}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Ready to Transform Your Learning?"
            subtitle="Join thousands of learners who are already preparing for the future."
            className="[&_h2]:text-white [&_p]:text-slate-300 [&_div]:bg-red-500"
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <PrimaryButton href="/signup" size="lg">
              Start Learning Now
            </PrimaryButton>
            <PrimaryButton href="/contact" variant="secondary" size="lg" className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
              Contact Us
            </PrimaryButton>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default DownloadApp;
