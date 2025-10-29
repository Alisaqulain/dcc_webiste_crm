'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

export default function IDCardDownloadPage() {
  const { rollNumber } = useParams();
  const [idCard, setIDCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIDCard();
  }, [rollNumber]);

  const fetchIDCard = async () => {
    try {
      const response = await fetch(`/api/idcard/${rollNumber}`);
      if (response.ok) {
        const data = await response.json();
        console.log('ID Card data:', data.idCard);
        console.log('Photo URL:', data.idCard?.photo);
        setIDCard(data.idCard);
      } else {
        setError('ID card not found');
      }
    } catch (error) {
      console.error('Error fetching ID card:', error);
      setError('Error loading ID card');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!idCard) return;

    const imageUrl = window.location.origin + '/id.jpg';
    const photoUrl = idCard.photo || '';
    const rollNum = idCard.rollNumber || 'N/A';

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${rollNum}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .certificate-container {
              position: relative;
              width: 400px;
              height: 600px;
              margin: 0 auto;
            }
            .certificate-image {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .certificate-overlay {
              position: absolute;
              color: black;
              font-weight: bold;
            }
            @media print {
              body {
                background: white;
                padding: 0;
              }
              .certificate-container {
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="certificate-container">
            <img src="${imageUrl}" alt="ID Card" class="certificate-image" onload="window.printWhenReady = true; if (window.imageLoaded) window.printReady();" onerror="console.error('Image failed to load:', '${imageUrl}'); window.printWhenReady = true; if (window.imageLoaded) window.printReady();" />
            ${photoUrl ? `<img src="${photoUrl.startsWith('http') || photoUrl.startsWith('data:') ? photoUrl : photoUrl.startsWith('/') ? photoUrl : '/' + photoUrl}" alt="Student photo" class="certificate-overlay" style="top: 24%; left: 50%; transform: translateX(-50%); width: 160px; height: 160px; border-radius: 50%; object-fit: cover; border: 3px solid #dc2626; z-index: 15;" onerror="this.style.display='none'; console.error('Photo failed to load:', '${photoUrl}');" />` : ''}
            <div class="certificate-overlay" style="top: 92%; left: 33%; transform: translateX(-50%); font-size: 20px; font-weight: bold; text-align: center; z-index: 10;">${rollNum}</div>
          </div>
          <script>
            window.imageLoaded = false;
            window.printWhenReady = false;
            window.printReady = function() {
              if (window.printWhenReady && window.imageLoaded) {
                setTimeout(() => {
                  window.print();
                }, 500);
              }
            };
            const img = document.querySelector('.certificate-image');
            if (img.complete) {
              window.imageLoaded = true;
              if (window.printWhenReady) window.printReady();
            } else {
              img.onload = function() {
                window.imageLoaded = true;
                if (window.printWhenReady) window.printReady();
              };
              img.onerror = function() {
                window.imageLoaded = true;
                if (window.printWhenReady) window.printReady();
              };
            }
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
          <p className="text-gray-600">Loading ID card...</p>
        </div>
      </div>
    );
  }

  if (error || !idCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ID Card Not Found</h2>
          <p className="text-gray-600 mb-4">No ID card found for roll number: {rollNumber}</p>
          <a
            href="/idcard"
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to ID Cards
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Career Center</h1>
          <h2 className="text-xl text-gray-600">Student ID Card</h2>
        </div>

        {/* ID Card Display */}
        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-[400px] aspect-[2/3]">
            <Image
              src="/id.jpg"
              alt="ID Card Template"
              fill
              className="object-contain rounded-lg shadow-lg"
              priority
            />
            
            {/* Overlay Elements - Positioned absolutely over the ID card image */}
            {/* Student Photo - Circular */}
            {idCard.photo && (
              <>
                <img 
                  src={idCard.photo.startsWith('http') || idCard.photo.startsWith('data:') ? idCard.photo : idCard.photo.startsWith('/') ? idCard.photo : `/${idCard.photo}`}
                  alt="Student photo" 
                  className='absolute z-10 rounded-full object-cover border-4 border-red-600'
                  style={{ 
                    top: '24%', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'clamp(150px, 30vw, 160px)', 
                    height: 'clamp(150px, 30vw, 160px)',
                    backgroundColor: '#f3f4f6'
                  }}
                  onError={(e) => {
                    console.error('Photo failed to load. Original URL:', idCard.photo);
                    const attemptedUrl = idCard.photo.startsWith('http') || idCard.photo.startsWith('data:') ? idCard.photo : idCard.photo.startsWith('/') ? idCard.photo : `/${idCard.photo}`;
                    console.error('Attempted URL:', attemptedUrl);
                    e.target.style.border = '2px solid red';
                    e.target.style.opacity = '0.5';
                  }}
                  onLoad={() => {
                    console.log('Photo loaded successfully:', idCard.photo);
                  }}
                />
                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="absolute top-4 left-4 z-20 bg-yellow-100 p-2 text-xs rounded">
                    Photo: {idCard.photo ? 'Present' : 'Missing'}
                  </div>
                )}
              </>
            )}
            
            {/* Roll Number */}
            <span className='absolute z-10 font-bold text-black whitespace-nowrap' style={{ top: '92%', left: '33%', transform: 'translateX(-50%)', fontSize: 'clamp(17px, 3vw, 20px)', textAlign: 'center' }}>
               {idCard.rollNumber || 'N/A'}
            </span>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleDownload}
            className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors mr-4"
          >
            Download/Print ID Card
          </button>
          <a
            href="/idcard"
            className="bg-gray-600 text-white px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to ID Cards
          </a>
        </div>
      </div>
    </div>
  );
}
