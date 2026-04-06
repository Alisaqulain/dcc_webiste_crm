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
    const blocked =
      pathname === '/profile' ||
      pathname.startsWith('/profile/') ||
      pathname === '/my-courses' ||
      pathname.startsWith('/my-courses/') ||
      pathname === '/referral' ||
      pathname.startsWith('/referral/') ||
      pathname === '/crm' ||
      pathname.startsWith('/crm/');

    if (blocked) {
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
