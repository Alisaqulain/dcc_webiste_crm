// src/components/Header.jsx
"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useCrmAccess } from '../hooks/useCrmAccess';

const Header = () => {
  const { data: session, status } = useSession();
  const { hasCrmAccess } = useCrmAccess();
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Handle courses dropdown hover enter
  const handleCoursesMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setCoursesOpen(true);
  };

  // Handle courses dropdown hover leave (with delay)
  const handleCoursesMouseLeave = () => {
    const timeout = setTimeout(() => {
      setCoursesOpen(false);
    }, 300); // 300ms delay to close
    setCloseTimeout(timeout);
  };

  // Handle downloads dropdown hover enter
  const handleDownloadsMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setDownloadsOpen(true);
  };

  // Handle downloads dropdown hover leave (with delay)
  const handleDownloadsMouseLeave = () => {
    const timeout = setTimeout(() => {
      setDownloadsOpen(false);
    }, 300); // 300ms delay to close
    setCloseTimeout(timeout);
  };

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 shadow-sm bg-white border-b-2 border-red-600 relative">
      {/* Logo */}
    <a href="/">  <div className="flex items-center space-x-2 sm:space-x-3">
        <img
          src="/logo.jpg"
          alt="Logo"
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full"
        />
        <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-900">
          Digital Career Center
        </span>
      </div></a>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-8">
        <a
          href="/"
          className="text-gray-900 font-medium hover:text-red-600 transition-colors"
        >
          Home
        </a>

        {/* Courses Dropdown */}
        <div
          className="relative"
          onMouseEnter={handleCoursesMouseEnter}
          onMouseLeave={handleCoursesMouseLeave}
        >
          <div className="flex items-center">
            <Link
              href="/courses"
              className="text-gray-900 font-medium hover:text-red-600 transition-colors"
            >
              All Courses
            </Link>
            <button
              className="ml-1 text-gray-900 font-medium hover:text-red-600 transition-colors"
              aria-haspopup="menu"
              aria-expanded={coursesOpen}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Courses Dropdown Menu */}
          <div
            className={`absolute transition-all duration-300 ease-out transform bg-white shadow-md rounded-md mt-2 w-48 border border-red-200 z-20
              ${
                coursesOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
          >
            {[
              { name: "Digital Starter Package", href: "/BronzeBundle" },
              { name: "Advance Basic Computer", href: "/silver" },
              { name: "Search Engine Optimization", href: "/gold" },
              { name: "Hindi Typing", href: "/platinum" },
              { name: "Youtube Ads", href: "/Diamond" },
              { name: "Google Ads", href: "/dcc" },
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="block px-4 py-2 text-[12px] text-gray-900 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setCoursesOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

        <a
          href="/blog"
          className="text-gray-900 font-medium hover:text-red-600 transition-colors"
        >
          Blog
        </a>

        {/* Downloads Dropdown */}
        <div
          className="relative"
          onMouseEnter={handleDownloadsMouseEnter}
          onMouseLeave={handleDownloadsMouseLeave}
        >
          <div className="flex items-center">
            <span className="text-gray-900 font-medium hover:text-red-600 transition-colors cursor-pointer">
              Downloads
            </span>
            <button
              className="ml-1 text-gray-900 font-medium hover:text-red-600 transition-colors"
              aria-haspopup="menu"
              aria-expanded={downloadsOpen}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {/* Downloads Dropdown Menu */}
          <div
            className={`absolute transition-all duration-300 ease-out transform bg-white shadow-md rounded-md mt-2 w-48 border border-red-200 z-20
              ${
                downloadsOpen
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
          >
            {[
              { name: "Download App", href: "/download-app" },
              { name: "Download Certificate", href: "/certificate" },
              { name: "Download ID Card", href: "/idcard" },
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className="block px-4 py-2 text-[12px] text-gray-900 hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => setDownloadsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
        {session ? (
          <>
            <Link
              href="/my-courses"
              className="text-gray-900 font-medium hover:text-red-600 transition-colors"
            >
              My Courses
            </Link>
            <Link
              href="/referral"
              className="text-gray-900 font-medium hover:text-red-600 transition-colors"
            >
              Refer & Earn
            </Link>
            <Link
              href="/profile"
              className="text-gray-900 font-medium hover:text-red-600 transition-colors"
            >
              My Profile
            </Link>
            {hasCrmAccess && (
              <Link
                href="/crm"
                className="text-gray-900 font-medium hover:text-red-600 transition-colors"
              >
                CRM
              </Link>
            )}
          </>
        ) : (
          <a
            href="/courses"
            className="text-gray-900 font-medium hover:text-red-600 transition-colors"
          >
            Browse Courses
          </a>
        )}
      </nav>

      {/* Login/Signup or Logout (Desktop) */}
      {session ? (
        <div className="hidden md:flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            Welcome, {session.user?.name?.split(' ')[0] || 'User'}!
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 sm:px-6 py-2 rounded-full transition-colors shadow-md hover:shadow-lg"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="hidden md:flex bg-red-600 hover:bg-red-700 text-white font-medium px-4 sm:px-6 py-2 rounded-full transition-colors shadow-md hover:shadow-lg space-x-2">
          <a href="/login" className="hover:underline text-sm sm:text-base">
            Login
          </a>
          <span>/</span>
          <a href="/signup" className="hover:underline text-sm sm:text-base">
            Signup
          </a>
        </div>
      )}

      {/* Mobile Hamburger */}
      <button
        className="md:hidden flex flex-col space-y-1.5 p-1"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="w-5 h-0.5 bg-gray-800"></span>
        <span className="w-5 h-0.5 bg-gray-800"></span>
        <span className="w-5 h-0.5 bg-gray-800"></span>
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-md border-t border-gray-200 md:hidden z-20">
          <nav className="flex flex-col p-4 space-y-3">
            <a
              href="/"
              className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
            >
              Home
            </a>
            <div className="flex flex-col space-y-1">
              <Link
                href="/courses"
                className="font-medium text-gray-900 hover:text-red-600 text-sm sm:text-base"
              >
                All Courses
              </Link>
              <div className="pl-4 flex flex-col space-y-1">
                <a
                  href="/BronzeBundle"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Digital Starter Package
                </a>
                <a
                  href="/silver"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Advance Basic Computer
                </a>
                <a
                  href="/gold"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Search Engine Optimization
                </a>
                <a
                  href="/platinum"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Hindi Typing
                </a>
                <a
                  href="/Diamond"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Youtube Ads
                </a>
                <a
                  href="/dcc"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Google Ads
                </a>
              </div>
            </div>
            <a
              href="/blog"
              className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
            >
              Blog
            </a>
            
            {/* Mobile Downloads Section */}
            <div className="flex flex-col space-y-1">
              <div className="font-medium text-gray-900 text-sm sm:text-base py-1">
                Downloads
              </div>
              <div className="pl-4 flex flex-col space-y-1">
                <a
                  href="/download-app"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Download App
                </a>
                <a
                  href="/certificate"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Download Certificate
                </a>
                <a
                  href="/idcard"
                  className="text-xs sm:text-sm text-gray-700 hover:text-red-600 py-1"
                >
                  Download ID Card
                </a>
              </div>
            </div>
            {session ? (
              <>
                <Link
                  href="/my-courses"
                  className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
                >
                  My Courses
                </Link>
                <Link
                  href="/referral"
                  className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
                >
                  Refer & Earn
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
                >
                  My Profile
                </Link>
                {hasCrmAccess && (
                  <Link
                    href="/crm"
                    className="text-gray-900 hover:text-red-600 text-sm sm:text-base py-1"
                  >
                    CRM
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full shadow-md text-center mt-2 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full shadow-md text-center mt-2">
                <Link href="/login" className="hover:underline text-sm">
                  Login
                </Link>{" "}
                /{" "}
                <Link href="/signup" className="hover:underline text-sm">
                  Signup
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
