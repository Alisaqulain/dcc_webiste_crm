/**
 * Turn /uploads/... into absolute URL on production when NEXTAUTH_URL or site URL is set.
 */
export function resolvePublicUrl(url, request) {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
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
