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

export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { id } = await params;
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

    const idCard = await IDCard.findById(id);
    if (!idCard) {
      return NextResponse.json(
        { error: 'ID card not found' },
        { status: 404 }
      );
    }

    // Check if roll number already exists (excluding current ID card)
    const existingIDCard = await IDCard.findOne({ 
      rollNumber, 
      _id: { $ne: id } 
    });
    if (existingIDCard) {
      return NextResponse.json(
        { error: 'ID card with this roll number already exists' },
        { status: 400 }
      );
    }

    // Update ID card
    idCard.studentName = studentName;
    idCard.rollNumber = rollNumber;
    idCard.courseName = courseName;
    if (photo) {
      idCard.photo = photo;
    }

    await idCard.save();

    return NextResponse.json({
      success: true,
      message: 'ID card updated successfully',
      idCard
    });

  } catch (error) {
    console.error('Error updating ID card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update ID card' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { id } = await params;

    const idCard = await IDCard.findById(id);
    if (!idCard) {
      return NextResponse.json(
        { error: 'ID card not found' },
        { status: 404 }
      );
    }

    await IDCard.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'ID card deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ID card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete ID card' },
      { status: 500 }
    );
  }
}
