'use client';

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
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
