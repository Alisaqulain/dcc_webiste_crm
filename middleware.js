import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  async function middleware(req) {
    // Allow all routes - CRM access is checked in the layout component
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
  matcher: [] // Empty matcher - no routes are blocked by middleware
};


