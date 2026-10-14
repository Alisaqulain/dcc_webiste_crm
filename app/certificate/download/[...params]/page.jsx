'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseCertificateDownloadParams } from '@/lib/parseCertificateDownloadParams';
import CertificatePreview, {
  printCertificateElement,
} from '@/app/components/certificate/CertificatePreview';

export default function CertificateDownloadPage() {
  const params = useParams();
  const router = useRouter();
  const segments = Array.isArray(params?.params)
    ? params.params
    : params?.params
      ? [params.params]
      : [];
  const { documentType, rollNumber } = parseCertificateDownloadParams(segments);
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFoundHint, setNotFoundHint] = useState('');

  useEffect(() => {
    if (documentType === 'idcard' && rollNumber) {
      router.replace(`/idcard/download/${encodeURIComponent(rollNumber)}`);
      return;
    }
    if (!rollNumber) {
      setError('Roll number is required');
      setIsLoading(false);
      return;
    }
    fetchCertificate();
  }, [rollNumber, documentType, router]);

  const fetchCertificate = async () => {
    setIsLoading(true);
    setError(null);
    setNotFoundHint('');
    try {
      const encodedRollNumber = encodeURIComponent(rollNumber);
      const response = await fetch(`/api/certificate/${encodedRollNumber}`);
      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
      } else {
        const data = await response.json().catch(() => ({}));
        setError('Certificate not found');
        setNotFoundHint(
          data.hint ||
            'Use the full roll number printed on your certificate (e.g. 00781/DCC55).'
        );
      }
    } catch (err) {
      console.error('Error fetching certificate:', err);
      setError('Error loading certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    const sheet = document.getElementById('certificate-sheet');
    printCertificateElement(sheet, `Certificate - ${certificate.studentName || 'Student'}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Certificate Not Found
          </h2>
          <p className="text-gray-600 mb-2">
            No certificate found for: <strong>{rollNumber}</strong>
          </p>
          {notFoundHint ? (
            <p className="text-sm text-gray-500 mb-6">{notFoundHint}</p>
          ) : (
            <p className="text-sm text-gray-500 mb-6">
              Try the full roll number from your certificate (e.g.{' '}
              <span className="font-mono">00781/DCC55</span>), not only the short
              code.
            </p>
          )}
          <Link
            href="/certificate"
            className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
          >
            Try another roll number
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-10">
      <div className="max-w-6xl mx-auto px-3 sm:px-6">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
          <p className="text-center text-sm text-gray-500 mb-4 sm:hidden">
            Pinch to zoom if text looks small
          </p>

          <div className="bg-gray-100 rounded-xl p-2 sm:p-4">
            <CertificatePreview certificate={certificate} />
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Roll no. {certificate.rollNumber}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full sm:w-auto bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Download / Print
            </button>
            <Link
              href="/certificate"
              className="w-full sm:w-auto text-center bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Try another roll number
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
