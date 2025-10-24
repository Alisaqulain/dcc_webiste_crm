import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Certificate from '@/models/Certificate';
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
      parentName,
      relation,
      courseName,
      duration,
      startDate,
      endDate,
      rollNumber
    } = body;

    // Validate required fields
    if (!studentName || !parentName || !courseName || !duration || !startDate || !endDate || !rollNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    // Check if roll number already exists (excluding current certificate)
    const existingCertificate = await Certificate.findOne({ 
      rollNumber, 
      _id: { $ne: id } 
    });
    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate with this roll number already exists' },
        { status: 400 }
      );
    }

    // Update certificate
    certificate.studentName = studentName;
    certificate.parentName = parentName;
    certificate.relation = relation;
    certificate.courseName = courseName;
    certificate.duration = parseInt(duration);
    certificate.startDate = new Date(startDate);
    certificate.endDate = new Date(endDate);
    certificate.rollNumber = rollNumber;

    await certificate.save();

    return NextResponse.json({
      success: true,
      message: 'Certificate updated successfully',
      certificate
    });

  } catch (error) {
    console.error('Error updating certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update certificate' },
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

    const certificate = await Certificate.findById(id);
    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      );
    }

    await Certificate.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Certificate deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete certificate' },
      { status: 500 }
    );
  }
}
