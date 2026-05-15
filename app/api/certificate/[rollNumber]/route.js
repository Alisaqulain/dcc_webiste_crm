import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { findCertificateByRollNumber } from '@/lib/certificateLookup';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    let { rollNumber } = await params;
    
    if (rollNumber) {
      rollNumber = decodeURIComponent(rollNumber);
    }
    
    if (!rollNumber?.trim()) {
      return NextResponse.json(
        { error: 'Roll number is required' },
        { status: 400 }
      );
    }

    const certificate = await findCertificateByRollNumber(rollNumber);
    
    if (!certificate) {
      return NextResponse.json(
        {
          error: 'Certificate not found',
          hint: 'Try the full roll number (e.g. 00781/DCC55) if you only entered part of it.',
        },
        { status: 404 }
      );
    }

    // Convert to plain object to ensure all fields are included
    const certificateData = certificate.toObject ? certificate.toObject() : certificate;
    console.log('Certificate photo field:', certificateData.photo);

    return NextResponse.json({
      success: true,
      certificate: certificateData
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
