import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import IDCard from '@/models/IDCard';
import jwt from 'jsonwebtoken';

// Verify admin token
const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const idCards = await IDCard.find().sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      idCards
    });

  } catch (error) {
    console.error('Error fetching ID cards:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ID cards' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const body = await request.json();
    const {
      rollNumber,
      photo
    } = body;

    // Validate required fields
    if (!rollNumber) {
      return NextResponse.json(
        { error: 'Roll number is required' },
        { status: 400 }
      );
    }

    // Check if roll number already exists
    const existingIDCard = await IDCard.findOne({ rollNumber });
    if (existingIDCard) {
      return NextResponse.json(
        { error: 'ID card with this roll number already exists' },
        { status: 400 }
      );
    }

    // Create ID card with explicit defaults
    const idCardData = {
      rollNumber: rollNumber.trim(),
      photo: (photo && photo.trim()) || '',
      studentName: '',
      courseName: ''
    };

    console.log('Creating ID card with data:', idCardData);

    const idCard = new IDCard(idCardData);

    // Explicitly set all fields to ensure they're present
    idCard.studentName = idCard.studentName || '';
    idCard.courseName = idCard.courseName || '';
    idCard.photo = idCard.photo || '';

    console.log('ID card before save:', {
      studentName: idCard.studentName,
      courseName: idCard.courseName,
      rollNumber: idCard.rollNumber,
      photo: idCard.photo
    });

    await idCard.save();

    console.log('ID card saved successfully');

    return NextResponse.json({
      success: true,
      message: 'ID card created successfully',
      idCard
    });

  } catch (error) {
    console.error('Error creating ID card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ID card' },
      { status: 500 }
    );
  }
}
