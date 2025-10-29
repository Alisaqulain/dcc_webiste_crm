import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import IDCard from '@/models/IDCard';

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

    const idCard = await IDCard.findOne({ rollNumber });
    
    if (!idCard) {
      return NextResponse.json(
        { error: 'ID card not found' },
        { status: 404 }
      );
    }

    // Convert to plain object to ensure all fields are included
    const idCardData = idCard.toObject ? idCard.toObject() : idCard;
    console.log('ID Card photo field:', idCardData.photo);

    return NextResponse.json({
      success: true,
      idCard: idCardData
    });

  } catch (error) {
    console.error('Error fetching ID card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ID card' },
      { status: 500 }
    );
  }
}
