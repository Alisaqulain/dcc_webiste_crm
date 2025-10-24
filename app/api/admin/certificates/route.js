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

export async function GET(request) {
  try {
    // Verify admin authentication
    verifyAdminToken(request);
    
    await connectDB();
    
    const certificates = await Certificate.find().sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      certificates
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch certificates' },
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

    // Check if roll number already exists
    const existingCertificate = await Certificate.findOne({ rollNumber });
    if (existingCertificate) {
      return NextResponse.json(
        { error: 'Certificate with this roll number already exists' },
        { status: 400 }
      );
    }

    const certificate = new Certificate({
      studentName,
      parentName,
      relation,
      courseName,
      duration: parseInt(duration),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rollNumber
    });

    await certificate.save();

    return NextResponse.json({
      success: true,
      message: 'Certificate created successfully',
      certificate
    });

  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create certificate' },
      { status: 500 }
    );
  }
}
