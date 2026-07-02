import React from 'react';

import Link from 'next/link';

import { FaFacebookF, FaInstagram, FaLinkedinIn, FaTelegramPlane, FaYoutube, FaWhatsapp } from 'react-icons/fa';



const Footer = () => {

  return (

    <footer className="relative bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 mt-auto overflow-hidden">

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute -top-32 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />

      </div>



      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">

          <div className="sm:col-span-2 lg:col-span-1">

            <Link href="/" className="inline-flex items-center mb-5 group">
              <img
                src="/newlogo.jpeg"
                alt="Digital Career Center"
                className="h-14 sm:h-16 md:h-[4.5rem] w-auto max-w-[320px] sm:max-w-[400px] object-contain rounded-md group-hover:opacity-90 transition-opacity duration-300"
              />
            </Link>

            <p className="text-sm leading-relaxed text-slate-400 mb-6 max-w-sm">

              Transform your career with expert-led digital skills training. Learn from industry professionals and get certified.

            </p>

            <div className="flex gap-2.5">

              {[

                { Icon: FaFacebookF, href: 'https://www.facebook.com/people/Digital-Career-Center/61565596980338/' },

                { Icon: FaInstagram, href: 'https://www.instagram.com/digitalcareercenterofficial' },

                { Icon: FaYoutube, href: 'https://www.youtube.com/@DigitalCareercenter' },

                { Icon: FaTelegramPlane, href: 'https://t.me/digitalcareercentermzn' },

                { Icon: FaLinkedinIn, href: 'https://www.linkedin.com/company/digital-career-center' },

              ].map(({ Icon, href }) => (

                <a

                  key={href}

                  href={href}

                  target="_blank"

                  rel="noopener noreferrer"

                  className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center hover:bg-red-600 hover:border-red-500 hover:text-white hover:-translate-y-0.5 transition-all duration-200"

                >

                  <Icon className="text-base" />

                </a>

              ))}

            </div>

          </div>



          <div>

            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>

            <ul className="space-y-2.5 text-sm">

              <li><Link href="/courses" className="dcc-footer-link">All Courses</Link></li>

              <li><Link href="/my-courses" className="dcc-footer-link">My Courses</Link></li>

              <li><Link href="/login" className="dcc-footer-link">Login</Link></li>

              <li><Link href="/signup" className="dcc-footer-link">Sign Up</Link></li>

            </ul>

          </div>



          <div>

            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>

            <ul className="space-y-2.5 text-sm">

              <li><Link href="/about" className="dcc-footer-link">About Us</Link></li>

              <li><Link href="/blog" className="dcc-footer-link">Blog</Link></li>

              <li><Link href="/contact" className="dcc-footer-link">Contact</Link></li>

              <li><Link href="/faq" className="dcc-footer-link">FAQ</Link></li>

              <li><Link href="/download-app" className="dcc-footer-link">Download App</Link></li>

            </ul>

          </div>



          <div>

            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal & Support</h3>

            <ul className="space-y-2.5 text-sm">

              <li><Link href="/privacy-policy" className="dcc-footer-link">Privacy Policy</Link></li>

              <li><Link href="/terms-and-conditions" className="dcc-footer-link">Terms & Conditions</Link></li>

              <li><Link href="/refund-policy" className="dcc-footer-link">Refund Policy</Link></li>

              <li><Link href="/cookie-policy" className="dcc-footer-link">Cookie Policy</Link></li>

              <li><Link href="/contact" className="dcc-footer-link">Support</Link></li>

            </ul>

          </div>

        </div>



        <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">

          <p>© {new Date().getFullYear()} Digital Career Center. All rights reserved.</p>

          <p>

            Developed by{' '}

            <a href="https://www.devspheresolutions.in/" className="text-red-400 hover:text-red-300 transition-colors" target="_blank" rel="noopener noreferrer">

              DevSphere Solutions

            </a>

          </p>

        </div>

      </div>



      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-3 z-40">

        <a

          href="https://www.instagram.com/digitalcareercenterofficial"

          target="_blank"

          rel="noopener noreferrer"

          className="dcc-fab bg-gradient-to-br from-purple-500 to-pink-500"

          aria-label="Instagram"

        >

          <FaInstagram className="text-white text-xl" />

        </a>

        <a

          href="https://wa.me/917599863007"

          target="_blank"

          rel="noopener noreferrer"

          className="dcc-fab bg-gradient-to-br from-green-500 to-emerald-600"

          aria-label="WhatsApp"

        >

          <FaWhatsapp className="text-white text-xl" />

        </a>

      </div>

    </footer>

  );

};



export default Footer;

