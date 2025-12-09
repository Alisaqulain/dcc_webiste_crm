import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    // Skip middleware for static files and Next.js internal routes
    const pathname = req.nextUrl.pathname;
    
    // Skip static files
    if (
      pathname.startsWith('/_next/static') ||
      pathname.startsWith('/_next/image') ||
      pathname.startsWith('/favicon.ico') ||
      pathname.startsWith('/public') ||
      pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
    ) {
      return NextResponse.next();
    }
    
    // Allow all other routes - CRM access is checked in the layout component
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all routes - authentication and access checks happen in components
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};


