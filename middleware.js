import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (token && token.isActive === false) {
    const path = pathname;
    const allowedForUnpaid =
      path === '/' ||
      path.startsWith('/courses') ||
      path.startsWith('/purchase') ||
      path.startsWith('/course/') ||
      path.startsWith('/login') ||
      path.startsWith('/signup') ||
      path.startsWith('/forgot-password') ||
      path.startsWith('/reset-password') ||
      path.startsWith('/privacy-policy') ||
      path.startsWith('/terms-and-conditions') ||
      path.startsWith('/refund-policy') ||
      path.startsWith('/cookie-policy') ||
      path.startsWith('/disclaimer') ||
      path.startsWith('/contact');

    if (!allowedForUnpaid) {
      const u = new URL('/courses', req.url);
      u.searchParams.set('pendingPurchase', '1');
      return NextResponse.redirect(u);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
