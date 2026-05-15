'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { parseCertificateDownloadParams } from '@/lib/parseCertificateDownloadParams';
import CertificatePreview, {
  buildCertificatePrintHtml,
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

    const {
      studentName,
      parentName,
      courseName,
      duration,
      startDate,
      endDate,
      rollNum,
      photoUrl,
    } = buildCertificatePrintHtml(certificate);

    const imageUrl = `${window.location.origin}/certificate1.jpg`;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${studentName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: Arial, sans-serif;
              background: white;
              display: flex;
              justify-content: center;
              padding: 12px;
            }
            .stage {
              position: relative;
              width: 100%;
              max-width: 1000px;
            }
            .stage img.bg {
              width: 100%;
              height: auto;
              display: block;
            }
            .overlay {
              position: absolute;
              font-weight: bold;
              color: black;
              z-index: 10;
            }
            .photo {
              top: 25%;
              left: 80%;
              width: 13%;
              aspect-ratio: 1.08;
              object-fit: cover;
              border-radius: 8px;
              border: 2px solid #ccc;
            }
            .roll { top: 27%; left: 55.5%; font-size: 14px; white-space: nowrap; }
            .name { top: 45%; left: 60%; font-size: 18px; white-space: nowrap; }
            .parent { top: 50%; left: 47%; font-size: 14px; white-space: nowrap; }
            .course { top: 53.5%; left: 50%; font-size: 13px; max-width: 38%; line-height: 1.2; }
            .duration { top: 58%; left: 65%; font-size: 14px; white-space: nowrap; }
            .start { top: 62%; left: 45%; font-size: 12px; white-space: nowrap; }
            .end { top: 62%; left: 65%; font-size: 12px; white-space: nowrap; }
            @media print {
              body { padding: 0; }
              .stage { max-width: none; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="stage">
            <img src="${imageUrl}" alt="Certificate" class="bg" />
            ${photoUrl ? `<img src="${photoUrl}" alt="" class="overlay photo" onerror="this.style.display='none'" />` : ''}
            <div class="overlay roll">${rollNum}</div>
            <div class="overlay name">${studentName}</div>
            <div class="overlay parent">${parentName}</div>
            <div class="overlay course">${courseName}</div>
            <div class="overlay duration">${duration}</div>
            <div class="overlay start">${startDate}</div>
            <div class="overlay end">${endDate}</div>
          </div>
          <script>
            (function () {
              var img = document.querySelector('.bg');
              function doPrint() {
                setTimeout(function () { window.print(); }, 600);
              }
              if (img && img.complete) doPrint();
              else if (img) img.onload = doPrint;
              else doPrint();
            })();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
