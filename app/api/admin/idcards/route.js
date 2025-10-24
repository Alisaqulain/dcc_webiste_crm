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
    verifyAdminToken(request);
    
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
    verifyAdminToken(request);
    
    await connectDB();
    
    const body = await request.json();
    const {
      studentName,
      rollNumber,
      courseName,
      photo
    } = body;

    // Validate required fields
    if (!studentName || !rollNumber || !courseName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const idCard = new IDCard({
      studentName,
      rollNumber,
      courseName,
      photo
    });

    await idCard.save();

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
