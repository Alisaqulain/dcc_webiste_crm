const REF_COOKIE = 'signup_ref';
const MAX_AGE = 60 * 60 * 24 * 30;

export function rememberReferralCode(code) {
  if (!code || typeof document === 'undefined') return;
  const trimmed = String(code).trim();
  if (!trimmed) return;
  document.cookie = `${REF_COOKIE}=${encodeURIComponent(trimmed)}; path=/; max-age=${MAX_AGE}; SameSite=Lax`;
}

export function referralCodeFromSearch(searchParams) {
  const ref = searchParams?.get?.('ref');
  return ref && String(ref).trim() ? String(ref).trim() : '';
}
