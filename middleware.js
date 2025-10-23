import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to CRM routes only if user is authenticated
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


