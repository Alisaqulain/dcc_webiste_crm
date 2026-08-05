'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCrmAccess } from '../hooks/useCrmAccess';
import PrimaryButton from './ui/PrimaryButton';

const LOGO_SRC = '/logo%20withoutbg.png';
const DEFAULT_PHONE = '+917599863007';
const DEFAULT_PHONE_DISPLAY = '+91-7599863007';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'All Courses' },
  { href: '/apps', label: 'Apps' },
  { href: '/blog', label: 'Blog' },
];

const DOWNLOAD_LINKS = [
  { name: 'Download App', href: '/download-app' },
  { name: 'Download Certificate', href: '/certificate' },
  { name: 'Download ID Card', href: '/idcard' },
];

function NavLink({ href, label, active, onClick }) {
  const cls = `nav-link ${active ? 'nav-link-active' : ''}`;
  if (href.startsWith('/') && !href.startsWith('//')) {
    return (
      <Link href={href} className={cls} onClick={onClick}>
        {label}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} onClick={onClick}>
      {label}
    </a>
  );
}

const Header = () => {
  const { data: session, status } = useSession();
  const { hasCrmAccess } = useCrmAccess();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState(null);
  const [servicesCloseTimeout, setServicesCloseTimeout] = useState(null);

  useEffect(() => {
    fetch('/api/services?header=true', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .catch(() => setServices([]));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  const isMandatoryCheckout =
    typeof pathname === 'string' &&
    pathname.startsWith('/purchase') &&
    status === 'authenticated' &&
    session &&
    session.user?.isActive === false;

  if (isMandatoryCheckout) {
    return (
      <header className="sticky top-0 z-50 bg-white border-b border-red-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <img src={LOGO_SRC} alt="Digital Career Center" width={400} height={80} className="h-14 sm:h-16 w-auto max-w-[260px] sm:max-w-[300px] object-contain shrink-0" />
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-slate-900 truncate">Digital Career Center</div>
              <p className="text-xs text-amber-800 truncate">Complete secure payment below to unlock courses & profile</p>
            </div>
          </div>
          <PrimaryButton size="sm" onClick={handleLogout}>Logout</PrimaryButton>
        </div>
      </header>
    );
  }

  const handleDownloadsMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setDownloadsOpen(true);
  };

  const handleDownloadsMouseLeave = () => {
    const timeout = setTimeout(() => setDownloadsOpen(false), 250);
    setCloseTimeout(timeout);
  };

  const handleServicesMouseEnter = () => {
    if (servicesCloseTimeout) {
      clearTimeout(servicesCloseTimeout);
      setServicesCloseTimeout(null);
    }
    setServicesOpen(true);
  };

  const handleServicesMouseLeave = () => {
    const timeout = setTimeout(() => setServicesOpen(false), 250);
    setServicesCloseTimeout(timeout);
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top contact bar */}
      <div className="bg-slate-900 text-white text-xs sm:text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-400 hidden sm:inline truncate max-w-[50%]">
            Management, Advertising & Marketing for Website
          </span>
          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
            <a href={`tel:${DEFAULT_PHONE}`} className="font-medium hover:text-red-300 transition-colors whitespace-nowrap">
              {DEFAULT_PHONE_DISPLAY}
            </a>
            <a href={`tel:${DEFAULT_PHONE}`} className="font-semibold text-red-400 hover:text-red-300 whitespace-nowrap">
              Call Now
            </a>
            <Link href="/contact" className="font-semibold hover:text-red-300 whitespace-nowrap">
              Enquire Now
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${
          scrolled ? 'dcc-glass-nav' : 'bg-white/80 backdrop-blur-sm border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 md:py-3.5">
          <Link href="/" className="flex items-center shrink-0 group">
            <img
              src={LOGO_SRC}
              alt="Digital Career Center"
              width={440}
              height={88}
              className="h-14 sm:h-16 md:h-20 w-auto max-w-[260px] sm:max-w-[300px] md:max-w-[360px] object-contain group-hover:opacity-90 transition-opacity duration-300"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} active={isActive(link.href)} />
            ))}

            {/* Services dropdown */}
            <div
              className="relative"
              onMouseEnter={handleServicesMouseEnter}
              onMouseLeave={handleServicesMouseLeave}
            >
              <Link
                href="/services"
                className={`nav-link inline-flex items-center gap-1 ${isActive('/services') ? 'nav-link-active' : ''}`}
              >
                Services
                <svg className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              <AnimatePresence>
                {servicesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full pt-2 w-64 z-30"
                  >
                    <div className="dcc-dropdown">
                      {services.length > 0 ? (
                        services.map((s) => (
                          <Link
                            key={s._id}
                            href={`/services/${s.slug}`}
                            className="dcc-dropdown-item"
                            onClick={() => setServicesOpen(false)}
                          >
                            {s.title}
                          </Link>
                        ))
                      ) : (
                        <span className="block px-4 py-2 text-sm text-slate-400">Coming soon</span>
                      )}
                      <Link href="/services" className="dcc-dropdown-item font-semibold text-red-600 border-t border-slate-100 mt-1">
                        View all services
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div
              className="relative"
              onMouseEnter={handleDownloadsMouseEnter}
              onMouseLeave={handleDownloadsMouseLeave}
            >
              <button
                type="button"
                className={`nav-link inline-flex items-center gap-1 ${isActive('/download') || isActive('/certificate') || isActive('/idcard') ? 'nav-link-active' : ''}`}
                aria-expanded={downloadsOpen}
              >
                Downloads
                <svg className={`w-4 h-4 transition-transform ${downloadsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <AnimatePresence>
                {downloadsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full pt-2 w-56 z-30"
                  >
                    <div className="dcc-dropdown">
                      {DOWNLOAD_LINKS.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="dcc-dropdown-item"
                          onClick={() => setDownloadsOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {session ? (
              <>
                <NavLink href="/my-courses" label="My Courses" active={isActive('/my-courses')} />
                <NavLink href="/profile" label="My Profile" active={isActive('/profile')} />
                {hasCrmAccess && (
                  <NavLink href="/crm" label="CRM" active={isActive('/crm')} />
                )}
              </>
            ) : (
              <NavLink href="/courses" label="Browse Courses" active={isActive('/courses')} />
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {session ? (
              <>
                <span className="text-sm text-slate-500 hidden xl:inline">
                  Hi, {session.user?.name?.split(' ')[0] || 'User'}
                </span>
                <PrimaryButton size="sm" onClick={handleLogout}>Logout</PrimaryButton>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <PrimaryButton href="/login" variant="secondary" size="sm">Login</PrimaryButton>
                <PrimaryButton href="/signup" size="sm">Sign up</PrimaryButton>
              </div>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-6 flex flex-col gap-1.5">
              <span className={`h-0.5 bg-slate-800 transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`h-0.5 bg-slate-800 transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`h-0.5 bg-slate-800 transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md overflow-hidden shadow-lg shadow-slate-200/30"
            >
              <nav className="px-4 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
                {NAV_LINKS.map((link) => (
                  <NavLink
                    key={link.href}
                    href={link.href}
                    label={link.label}
                    active={isActive(link.href)}
                    onClick={() => setMenuOpen(false)}
                  />
                ))}
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-3 pb-1 px-1">Services</p>
                {services.length > 0 ? (
                  services.map((s) => (
                    <Link
                      key={s._id}
                      href={`/services/${s.slug}`}
                      onClick={() => setMenuOpen(false)}
                      className="block nav-link pl-3"
                    >
                      {s.title}
                    </Link>
                  ))
                ) : (
                  <Link href="/services" onClick={() => setMenuOpen(false)} className="block nav-link pl-3">
                    Our Services
                  </Link>
                )}
                <Link href="/services" onClick={() => setMenuOpen(false)} className="block nav-link pl-3 text-red-600">
                  View all services
                </Link>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-3 pb-1 px-1">Downloads</p>
                {DOWNLOAD_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="block nav-link pl-3"
                  >
                    {item.name}
                  </Link>
                ))}
                {session ? (
                  <>
                    <NavLink href="/my-courses" label="My Courses" active={isActive('/my-courses')} onClick={() => setMenuOpen(false)} />
                    <NavLink href="/profile" label="My Profile" active={isActive('/profile')} onClick={() => setMenuOpen(false)} />
                    {hasCrmAccess && (
                      <NavLink href="/crm" label="CRM" active={isActive('/crm')} onClick={() => setMenuOpen(false)} />
                    )}
                    <div className="pt-3">
                      <PrimaryButton className="w-full" onClick={() => { setMenuOpen(false); handleLogout(); }}>
                        Logout
                      </PrimaryButton>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 pt-3">
                    <PrimaryButton href="/login" variant="secondary" className="w-full" onClick={() => setMenuOpen(false)}>Login</PrimaryButton>
                    <PrimaryButton href="/signup" className="w-full" onClick={() => setMenuOpen(false)}>Sign up</PrimaryButton>
                  </div>
                )}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Header;
