import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegramPlane, FaYoutube } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6"; // for Twitter (X) icon
import { FaWhatsapp } from "react-icons/fa";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 sm:py-8 md:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8">
        
        {/* Logo & About */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                   <img src="/logo.jpg" alt=""  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full" />

            Digital Career Center
          </h2>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed">
            Get ahead in your career with Digital Career Center, the one-stop solution for your educational needs. 
            Connect with top industry professionals and fuel your passion for success. 
            Join now and prepare for the real-world opportunities you've always desired.
          </p>

          {/* Social Icons */}
          <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-5 text-lg sm:text-xl">
            <a href="https://www.facebook.com/people/Digital-Career-Center/61565596980338/" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors"><FaFacebookF /></a>
            <a href="https://www.instagram.com/digitalcareercenterofficial" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors"><FaInstagram /></a>
            <a href="https://www.youtube.com/@DigitalCareercenter" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors"><FaYoutube /></a>
            <a href="https://t.me/digitalcareercentermzn" target="_blank" rel="noopener noreferrer" className="hover:text-red-400 transition-colors"><FaTelegramPlane /></a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 border-b border-red-500 inline-block">Quick Links</h3>
          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            {/* <li><a href="/" className="hover:text-red-300 transition-colors">Home</a></li>
            <li><a href="/about" className="hover:text-red-300 transition-colors">About Us</a></li>
            <li><a href="/blog" className="hover:text-red-300 transition-colors">Blog</a></li>
            <li><a href="/contact" className="hover:text-red-300 transition-colors">Contact Us</a></li> */}
            <li><a href="/login" className="hover:text-red-300 transition-colors">Login</a></li>
            <li><a href="/signup" className="hover:text-red-300 transition-colors">Sign Up</a></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 border-b border-red-500 inline-block">Company</h3>
          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <li><a href="/about" className="hover:text-red-300 transition-colors">About Us</a></li>
            <li><a href="/blog" className="hover:text-red-300 transition-colors">Blog</a></li>
            <li><a href="/download-app" className="hover:text-red-300 transition-colors">Download App</a></li>
            <li><a href="/contact" className="hover:text-red-300 transition-colors">Contact Us</a></li>
            <li><a href="/faq" className="hover:text-red-300 transition-colors">FAQ</a></li>
            <li><a href="/privacy-policy" className="hover:text-red-300 transition-colors">Privacy Policy</a></li>
            <li><a href="/terms-and-conditions" className="hover:text-red-300 transition-colors">Terms & Conditions</a></li>
          </ul>
        </div>

        {/* Legal & Support */}
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 border-b border-red-500 inline-block">Legal & Support</h3>
          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <li><a href="/privacy-policy" className="hover:text-red-300 transition-colors">Privacy Policy</a></li>
            <li><a href="/cookie-policy" className="hover:text-red-300 transition-colors">Cookie Policy</a></li>
            <li><a href="/terms-and-conditions" className="hover:text-red-300 transition-colors">Terms & Conditions</a></li>
            <li><a href="/refund-policy" className="hover:text-red-300 transition-colors">Refund Policy</a></li>
            <li><a href="/faq" className="hover:text-red-300 transition-colors">FAQ</a></li>
            <li><a href="/contact" className="hover:text-red-300 transition-colors">Support</a></li>
            <li><a href="/blog" className="hover:text-red-300 transition-colors">Blog</a></li>
          </ul>
        </div>

        {/* Courses Package */}
        <div>
          <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4 border-b border-red-500 inline-block">All Courses</h3>
          <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
            <li><a href="/BronzeBundle" className="hover:text-red-300 transition-colors">Digital Starter Package</a></li>
            <li><a href="/silver" className="hover:text-red-300 transition-colors">Advance Basic Computer</a></li>
            <li><a href="/gold" className="hover:text-red-300 transition-colors">Search Engine Optimization</a></li>
            <li><a href="/platinum" className="hover:text-red-300 transition-colors">Hindi Typing</a></li>
            <li><a href="/Diamond" className="hover:text-red-300 transition-colors">Youtube Ads</a></li>
            <li><a href="/dcc" className="hover:text-red-300 transition-colors">Google Ads</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-red-500 mt-6 sm:mt-8 md:mt-10 pt-4 sm:pt-6 text-center text-xs sm:text-sm px-4">
        © 2025 Design and Developed by <a href="https://www.devspheresolutions.in/" className="text-yellow-500"> DevSphere Solutions </a> . All Rights Reserved.
      </div>

      {/* Floating Buttons */}
      <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 flex flex-col gap-2 sm:gap-3">
        {/* Instagram Button */}
        <a 
          href="https://www.instagram.com/digitalcareercenterofficial" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 sm:p-3 rounded-full shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
        >
          <FaInstagram className="text-white text-lg sm:text-2xl" />
        </a>
        
        {/* WhatsApp Button */}
        <a 
          href="https://wa.me/917599863007" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="bg-green-500 p-2 sm:p-3 rounded-full shadow-lg hover:bg-green-600 transition-all transform hover:scale-105"
        >
          <FaWhatsapp className="text-white text-lg sm:text-2xl" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
