/**
 * Turn /uploads/... into absolute URL on production when NEXTAUTH_URL or site URL is set.
 */
export function resolvePublicUrl(url, request) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:')) return url;

  // Local dev uses the production site URL in env. Keep /uploads on this machine
  // so files saved in public/uploads actually show up.
  if (process.env.NODE_ENV === 'development') {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const path = new URL(url).pathname;
        return path.startsWith('/uploads/') ? path : url;
      }
    } catch {
      /* keep the original url */
    }
    return url.startsWith('/') ? url : `/${url}`;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  let base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    '';

  if (!base && request) {
    try {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      if (host) base = `${proto}://${host}`;
    } catch {
      /* ignore */
    }
  }

  if (!base) {
    return url.startsWith('/') ? url : `/${url}`;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  return `${base.replace(/\/$/, '')}${path}`;
}
