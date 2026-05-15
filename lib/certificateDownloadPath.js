/**
 * Build /certificate/download/... path with encoded segments (slashes in roll numbers).
 */
export function certificateDownloadPath(rollNumber) {
  const trimmed = String(rollNumber || '').trim();
  if (!trimmed) return '/certificate';
  const segments = trimmed.split('/').map((s) => encodeURIComponent(s.trim())).filter(Boolean);
  return `/certificate/download/${segments.join('/')}`;
}
