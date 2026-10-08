'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

export default function ConditionalSiteChrome({ children }) {
  const pathname = usePathname();
  const hideSiteChrome =
    pathname?.startsWith('/admin') || pathname?.startsWith('/crm');

  if (hideSiteChrome) {
    return <>{children}</>;
  }

  return (
    <>
      <Suspense fallback={<div className="h-24 bg-white border-b border-slate-100" aria-hidden />}>
        <Header />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
