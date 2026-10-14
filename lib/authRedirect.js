const AUTH_PATH_PREFIXES = ['/login', '/signup', '/admin/login', '/forgot-password', '/reset-password'];

/**
 * @param {string} pathname
 * @param {string} [search]
 * @returns {string | null}
 */
export function getReturnPathFromLocation(pathname, search = '') {
  if (!pathname || AUTH_PATH_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }
  return `${pathname}${search || ''}`;
}

/**
 * @param {string | null | undefined} returnPath
 * @returns {string}
 */
export function buildLoginUrl(returnPath) {
  if (!returnPath) return '/login';
  return `/login?redirect=${encodeURIComponent(returnPath)}`;
}

/**
 * @param {string | null | undefined} redirectOrCallbackUrl
 * @param {string} [fallback]
 * @returns {string}
 */
export function resolvePostLoginPath(redirectOrCallbackUrl, fallback = '/profile') {
  if (!redirectOrCallbackUrl || typeof redirectOrCallbackUrl !== 'string') {
    return fallback;
  }
  const trimmed = redirectOrCallbackUrl.trim();
  if (!trimmed) return fallback;

  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(trimmed, base);
    if (AUTH_PATH_PREFIXES.some((p) => url.pathname.startsWith(p))) {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (AUTH_PATH_PREFIXES.some((p) => path.startsWith(p))) {
      return fallback;
    }
    return path;
  }
}

/**
 * @param {string | null | undefined} returnPath
 * @returns {string | null}
 */
export function courseIdFromReturnPath(returnPath) {
  if (!returnPath) return null;
  const pathOnly = returnPath.split('?')[0].split('#')[0];
  const match = pathOnly.match(/^\/course\/([^/]+)/);
  return match ? match[1] : null;
}

export function comboIdFromReturnPath(returnPath) {
  if (!returnPath) return null;
  const pathOnly = returnPath.split('?')[0].split('#')[0];
  const match = pathOnly.match(/^\/(?:purchase\/)?combo\/([^/]+)/);
  return match ? match[1] : null;
}

export function refFromReturnPath(returnPath) {
  if (!returnPath) return null;
  const query = returnPath.split('?')[1] || '';
  if (!query) return null;
  const ref = new URLSearchParams(query.split('#')[0]).get('ref');
  return ref && ref.trim() ? ref.trim() : null;
}

/**
 * @param {string | null | undefined} returnPath
 * @returns {string}
 */
export function buildSignupUrl(returnPath) {
  if (!returnPath) return '/signup';
  const params = new URLSearchParams();
  params.set('redirect', returnPath);
  const comboId = comboIdFromReturnPath(returnPath);
  const courseId = courseIdFromReturnPath(returnPath);
  if (comboId) params.set('combo', comboId);
  else if (courseId) params.set('course', courseId);
  const ref = refFromReturnPath(returnPath);
  if (ref) params.set('ref', ref);
  return `/signup?${params.toString()}`;
}
