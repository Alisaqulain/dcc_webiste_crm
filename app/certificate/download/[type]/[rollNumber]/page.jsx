import { redirect } from 'next/navigation';

/**
 * Legacy URL: /certificate/download/certificate/ROLL or /certificate/download/idcard/ROLL
 * Restored without conflicting with [...params] (fixed two-segment paths only).
 */
export default function CertificateDownloadByTypePage({ params }) {
  const type = String(params?.type || '').toLowerCase();
  const roll = String(params?.rollNumber || '').trim();

  if (!roll) {
    redirect('/certificate');
  }

  const encoded = encodeURIComponent(roll);

  if (type === 'idcard') {
    redirect(`/idcard/download/${encoded}`);
  }

  if (type === 'certificate') {
    redirect(`/certificate/download/${encoded}`);
  }

  redirect(`/certificate/download/${encoded}`);
}
