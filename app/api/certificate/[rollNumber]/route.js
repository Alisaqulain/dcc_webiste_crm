import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certificate from '@/models/Certificate';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { rollNumber } = await params;
    
    if (!rollNumber) {
      return NextResponse.json(
        { error: 'Roll number is required' },
        { status: 400 }
      );
    }

    const certificate = await Certificate.findOne({ rollNumber });
    
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificate' },
      { status: 500 }
    );
  }
}
