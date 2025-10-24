'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function CertificateDownloadPage() {
  const { rollNumber } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificate();
  }, [rollNumber]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(`/api/certificate/${rollNumber}`);
      if (response.ok) {
        const data = await response.json();
        setCertificate(data.certificate);
      } else {
        setError('Certificate not found');
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
      setError('Error loading certificate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    // Create a new window with the certificate
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${certificate.studentName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .certificate {
              background: white;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              text-align: center;
            }
            .header {
              color: #dc2626;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 18px;
              margin-bottom: 30px;
            }
            .content {
              margin: 40px 0;
            }
            .student-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin: 20px 0;
            }
            .details {
              font-size: 16px;
              color: #555;
              line-height: 1.6;
              margin: 20px 0;
            }
            .dates {
              display: flex;
              justify-content: space-between;
              margin: 30px 0;
              font-size: 14px;
              color: #666;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 200px;
              margin: 10px 0 5px auto;
            }
            @media print {
              body { background: white; }
              .certificate { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="header">DIGITAL CAREER CENTER</div>
            <div class="subtitle">Certificate of Completion</div>
            
            <div class="content">
              <p class="details">
                This is to certify that
              </p>
              <div class="student-name">${certificate.studentName}</div>
              <p class="details">
                ${certificate.relation} <strong>${certificate.parentName}</strong><br>
                has successfully completed the course
              </p>
              <div class="student-name">${certificate.courseName}</div>
              <p class="details">
                Duration: ${certificate.duration} days
              </p>
            </div>
            
            <div class="dates">
              <div>From: ${new Date(certificate.startDate).toLocaleDateString()}</div>
              <div>To: ${new Date(certificate.endDate).toLocaleDateString()}</div>
            </div>
            
            <div class="signature">
              <div class="signature-line"></div>
              <div>Authorized Signature</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Certificate Not Found</h2>
          <p className="text-gray-600 mb-4">No certificate found for roll number: {rollNumber}</p>
          <a
            href="/certificate"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Certificates
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-600 mb-2">DIGITAL CAREER CENTER</h1>
            <h2 className="text-xl text-gray-600">Certificate of Completion</h2>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-4">This is to certify that</p>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">{certificate.studentName}</h3>
            <p className="text-lg text-gray-700 mb-2">
              {certificate.relation} <strong>{certificate.parentName}</strong>
            </p>
            <p className="text-lg text-gray-700 mb-4">has successfully completed the course</p>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">{certificate.courseName}</h4>
            <p className="text-lg text-gray-700">Duration: {certificate.duration} days</p>
          </div>

          <div className="flex justify-between text-sm text-gray-600 mb-8">
            <div>From: {new Date(certificate.startDate).toLocaleDateString()}</div>
            <div>To: {new Date(certificate.endDate).toLocaleDateString()}</div>
          </div>

          <div className="text-right">
            <div className="inline-block">
              <div className="border-t border-gray-400 w-48 mb-2"></div>
              <p className="text-sm text-gray-600">Authorized Signature</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleDownload}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors mr-4"
            >
              Download/Print Certificate
            </button>
            <a
              href="/certificate"
              className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Certificates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
