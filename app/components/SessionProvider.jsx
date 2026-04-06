'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export default function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      {children}
    </NextAuthSessionProvider>
  );
}
