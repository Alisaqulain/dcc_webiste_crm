import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certificate from '@/models/Certificate';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    let { rollNumber } = await params;
    
    // Decode URL-encoded roll number (handles slashes and special characters)
    if (rollNumber) {
      rollNumber = decodeURIComponent(rollNumber);
    }
    
    if (!rollNumber) {
      return NextResponse.json(
        { error: 'Roll number is required' },
        { status: 400 }
      );
    }

    // Decode the roll number to handle URL-encoded values (e.g., "Dt%2F1" -> "Dt/1")
    const decodedRollNumber = decodeURIComponent(rollNumber);
    
    // Try to find certificate with decoded roll number first
    let certificate = await Certificate.findOne({ rollNumber: decodedRollNumber });
    
    // If not found, try with the original (in case it's stored without encoding)
    if (!certificate) {
      certificate = await Certificate.findOne({ rollNumber });
    }
    
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
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
