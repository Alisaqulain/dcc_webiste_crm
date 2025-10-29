'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

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
        console.log('Certificate data:', data.certificate);
        console.log('Photo URL:', data.certificate?.photo);
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

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    
    // Create a new window with the certificate
    const printWindow = window.open('', '_blank');
    const studentName = certificate.studentName || 'N/A';
    const parentName = certificate.parentName || 'N/A';
    const courseName = certificate.courseName || 'N/A';
    const duration = certificate.duration || 0;
    const startDate = formatDate(certificate.startDate);
    const endDate = new Date(certificate.endDate).getFullYear();
    const rollNum = certificate.rollNumber || 'N/A';
    const photoUrl = certificate.photo || '';
    
    // Get the full URL for the certificate image
    const imageUrl = window.location.origin + '/certificate1.jpg';
    
    // Write the HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${studentName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .certificate-container {
              position: relative;
              width: 800px;
              max-width: 100%;
              aspect-ratio: 4/3;
              margin: 20px auto;
            }
            .certificate-image {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
              position: absolute;
              top: 0;
              left: 0;
            }
            .certificate-overlay {
              position: absolute;
              font-weight: bold;
              color: black;
              z-index: 10;
              white-space: nowrap;
            }
            /* Certificate Number */
            .overlay-roll { top: 26.5%; left: 55.5%; font-size: 18px; }
            /* Student Name */
            .overlay-name { top: 45%; left: 60%; font-size: 22px; }
            /* Parent Name */
            .overlay-parent { top: 49%; left: 47%; font-size: 18px; }
            /* Course Name */
            .overlay-course { top: 53%; left: 50%; font-size: 18px; }
            /* Duration */
            .overlay-duration { top: 57%; left: 65%; font-size: 18px; }
            /* Start Date */
            .overlay-start-date { top: 62%; left: 45%; font-size: 16px; }
            /* End Date */
            .overlay-end-date { top: 62%; left: 65%; font-size: 16px; }
            @media print {
              body { 
                background: white;
                margin: 0;
                padding: 0;
              }
              .certificate-container {
                margin: 0;
                width: 100%;
                page-break-after: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <img src="${imageUrl}" alt="Certificate" class="certificate-image" onload="window.printWhenReady = true; if (window.imageLoaded) window.printReady();" onerror="console.error('Image failed to load:', '${imageUrl}'); window.printWhenReady = true; if (window.imageLoaded) window.printReady();" />
            ${photoUrl ? `<img src="${photoUrl.startsWith('http') || photoUrl.startsWith('data:') ? photoUrl : photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}" alt="Student photo" class="certificate-overlay" style="top: 25%; left: 80%; width: 130px; height: 120px; border-radius: 8px; object-fit: cover; border: 2px solid #ccc; z-index: 15;" onerror="this.style.display='none'; console.error('Photo failed to load:', '${photoUrl}');" />` : ''}
            <div class="certificate-overlay overlay-roll">${rollNum}</div>
            <div class="certificate-overlay overlay-name">${studentName}</div>
            <div class="certificate-overlay overlay-parent">${parentName}</div>
            <div class="certificate-overlay overlay-course">${courseName}</div>
            <div class="certificate-overlay overlay-duration">${duration}</div>
            <div class="certificate-overlay overlay-start-date">${startDate}</div>
            <div class="certificate-overlay overlay-end-date">${endDate}</div>
          </div>
          <script>
            (function() {
              var img = document.querySelector('.certificate-image');
              var printReady = false;
              
              function tryPrint() {
                if (printReady) {
                  setTimeout(function() {
                    window.print();
                  }, 800);
                }
              }
              
              if (img) {
                if (img.complete && img.naturalHeight !== 0) {
                  printReady = true;
                  tryPrint();
                } else {
                  img.onload = function() {
                    printReady = true;
                    tryPrint();
                  };
                  img.onerror = function() {
                    console.error('Image failed to load:', '${imageUrl}');
                    alert('Certificate image could not be loaded. Please check the image path.');
                  };
                }
              }
              
              window.addEventListener('load', function() {
                if (!printReady && img && img.complete) {
                  printReady = true;
                  tryPrint();
                }
              });
            })();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Certificate Display Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 mb-8">
          {/* Certificate Image Container with Overlays */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4 sm:p-6 shadow-inner relative">
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src="/certificate1.jpg"
                  alt="Digital Career Center Certificate"
                  fill
                  className="object-contain rounded-lg shadow-lg"
                  priority
                />
                
                {/* Overlay Elements - Positioned absolutely over the certificate image */}
                {/* Student Photo - if available */}
                {certificate.photo && (
                  <>
                    <img 
                      src={certificate.photo.startsWith('http') || certificate.photo.startsWith('data:') ? certificate.photo : certificate.photo.startsWith('/') ? certificate.photo : `/${certificate.photo}`}
                      alt="Student photo" 
                      className='absolute z-10 rounded object-cover border-2 border-gray-300'
                      style={{ 
                        top: '25%', 
                        left: '80%', 
                        width: 'clamp(75px, 15vw, 140px)', 
                        height: 'clamp(80px, 15vw, 140px)',
                        backgroundColor: '#f3f4f6'
                      }}
                      onError={(e) => {
                        console.error('Photo failed to load. Original URL:', certificate.photo);
                        const attemptedUrl = certificate.photo.startsWith('http') || certificate.photo.startsWith('data:') ? certificate.photo : certificate.photo.startsWith('/') ? certificate.photo : `/${certificate.photo}`;
                        console.error('Attempted URL:', attemptedUrl);
                        e.target.style.border = '2px solid red';
                        e.target.style.opacity = '0.5';
                      }}
                      onLoad={() => {
                        console.log('Photo loaded successfully:', certificate.photo);
                      }}
                    />
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="absolute top-4 left-4 z-20 bg-yellow-100 p-2 text-xs rounded">
                        Photo: {certificate.photo ? 'Present' : 'Missing'}
          </div>
                    )}
                  </>
                )}
                
                {/* Certificate Number - positioned next to "Certificate No." label */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '26.5%', left: '55.5%', fontSize: 'clamp(12px, 1.8vw, 20px)' }}>
                  {certificate.rollNumber || 'N/A'}
                </span>
                
                {/* Student Name - positioned right after "Mr./Ms." label */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '45%', left: '60%', fontSize: 'clamp(14px, 2vw, 24px)' }}>
                  {certificate.studentName || 'N/A'}
                </span>
                
                {/* Parent/Guardian Name - positioned right after "S/o, D/o, ." label */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '49%', left: '47%', fontSize: 'clamp(12px, 1.8vw, 20px)' }}>
                  {certificate.parentName || 'N/A'}
                </span>
                
                {/* Course Name - positioned right after "in" */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '53%', left: '50%', fontSize: 'clamp(12px, 1.8vw, 20px)' }}>
                  {certificate.courseName || 'N/A'}
                </span>
                
                {/* Duration - positioned right before "/ Days by" */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '57%', left: '65%', fontSize: 'clamp(12px, 1.8vw, 20px)' }}>
                  {certificate.duration || 0}
                </span>
                
                {/* Start Date - positioned in date field (Dec 12, 2005 format) */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '62%', left: '45%', fontSize: 'clamp(10px, 1.5vw, 18px)' }}>
                  {formatDate(certificate.startDate)}
                </span>
                
                {/* End Date - positioned in date field (just year) */}
                <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '62%', left: '65%', fontSize: 'clamp(10px, 1.5vw, 18px)' }}>
                  {new Date(certificate.endDate).getFullYear()}
                </span>
          </div>
            </div>
          </div>

          {/* Download Button */}
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
