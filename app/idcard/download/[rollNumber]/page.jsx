'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

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
    // Create a new window with the ID card
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ID Card - ${idCard.studentName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            .id-card {
              background: white;
              width: 400px;
              height: 600px;
              margin: 0 auto;
              border-radius: 15px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
            }
            .header {
              background: #dc2626;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .logo {
              width: 60px;
              height: 60px;
              background: white;
              border-radius: 50%;
              margin: 0 auto 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              color: #dc2626;
              font-size: 18px;
            }
            .institution {
              font-size: 18px;
              font-weight: bold;
            }
            .body {
              padding: 30px 20px;
              text-align: center;
              position: relative;
            }
            .photo-placeholder {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: #f3f4f6;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid #dc2626;
              overflow: hidden;
            }
            .photo-placeholder img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .student-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .course {
              font-size: 16px;
              color: #666;
              margin-bottom: 20px;
            }
            .roll-number {
              font-size: 14px;
              color: #666;
              margin-bottom: 30px;
            }
            .qr-placeholder {
              width: 80px;
              height: 80px;
              background: #f3f4f6;
              margin: 0 auto 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #ddd;
            }
            .footer {
              position: absolute;
              bottom: 20px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 14px;
              color: #666;
            }
            .blue-stripe {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 20px;
              background: linear-gradient(45deg, #3b82f6, #1d4ed8);
            }
            @media print {
              body { background: white; }
              .id-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="id-card">
            <div class="header">
              <div class="logo">DCC</div>
              <div class="institution">DIGITAL CAREER CENTER</div>
            </div>
            
            <div class="body">
              <div class="photo-placeholder">
                ${idCard.photo ? `<img src="${idCard.photo}" alt="Student Photo">` : '<div style="color: #999;">Photo</div>'}
              </div>
              
              <div class="student-name">${idCard.studentName}</div>
              <div class="course">${idCard.courseName}</div>
              <div class="roll-number">Roll No: ${idCard.rollNumber}</div>
              
              <div class="qr-placeholder">
                <div style="color: #999; font-size: 12px;">QR Code</div>
              </div>
            </div>
            
            <div class="footer">
              <div>DCC STUDENT</div>
            </div>
            
            <div class="blue-stripe"></div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Digital Career Center</h1>
            <h2 className="text-xl text-gray-600">Student ID Card</h2>
          </div>

          {/* ID Card Preview */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300 border-2 border-gray-200">
              <div className="w-80 h-96 relative">
                {/* Header */}
                <div className="bg-red-600 text-white p-4 rounded-t-2xl text-center">
                  <div className="w-16 h-16 bg-white rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">DCC</span>
                  </div>
                  <div className="font-bold text-lg">DIGITAL CAREER CENTER</div>
                </div>
                
                {/* Body */}
                <div className="p-6 text-center">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    {idCard.photo ? (
                      <img
                        src={idCard.photo}
                        alt="Student photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">Photo</span>
                    )}
                  </div>
                  
                  <div className="text-xl font-bold text-gray-900 mb-2">{idCard.studentName}</div>
                  <div className="text-sm text-gray-600 mb-1">{idCard.courseName}</div>
                  <div className="text-xs text-gray-500 mb-4">Roll No: {idCard.rollNumber}</div>
                  
                  <div className="w-16 h-16 bg-gray-200 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">QR</span>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="bg-gray-100 p-2 text-center text-sm font-medium text-gray-700 rounded-b-2xl">
                  DCC STUDENT
                </div>
              </div>
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
    </div>
  );
}
