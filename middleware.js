import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    // For CRM routes, check if user has purchased CRM course
    if (req.nextUrl.pathname.startsWith('/crm')) {
      if (!req.nextauth.token) {
        return NextResponse.redirect(new URL('/login?redirect=' + req.nextUrl.pathname, req.url));
      }

      // CRM access will be checked in the layout component
      // Middleware only checks authentication
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to CRM routes only if user is authenticated
        // Detailed CRM course check happens in layout
        if (req.nextUrl.pathname.startsWith('/crm')) {
          return !!token;
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/crm/:path*']
};


