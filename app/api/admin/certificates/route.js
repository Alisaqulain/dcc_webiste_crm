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
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
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
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }
    
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
      rollNumber,
      photo
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

    console.log('Creating certificate with photo:', photo);
    console.log('Photo type:', typeof photo);
    console.log('Photo value check:', !!photo);
    
    const certificateData = {
      studentName,
      parentName,
      relation,
      courseName,
      duration: parseInt(duration),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      rollNumber
    };
    
    // Always include photo field - set to undefined if not provided
    if (photo !== undefined && photo !== null && photo !== '') {
      const photoValue = String(photo).trim();
      certificateData.photo = photoValue;
      console.log('Photo added to certificateData:', certificateData.photo);
      console.log('Certificate data object keys:', Object.keys(certificateData));
    } else {
      console.log('Photo not provided or empty. Photo value:', photo);
    }

    console.log('Certificate data before save:', JSON.stringify(certificateData, null, 2));
    const certificate = new Certificate(certificateData);
    
    // Explicitly set photo if it exists (sometimes needed for mongoose)
    if (certificateData.photo) {
      certificate.photo = certificateData.photo;
      certificate.markModified('photo');
      console.log('Photo explicitly set on certificate:', certificate.photo);
    }
    
    // Explicitly check photo after instantiation
    console.log('Certificate photo after instantiation:', certificate.photo);
    console.log('Certificate photo property:', certificate.get('photo'));

    await certificate.save();
    
    // Reload from database to verify it was saved
    const savedCertificate = await Certificate.findById(certificate._id);
    console.log('Certificate saved. Photo in DB (reloaded):', savedCertificate?.photo);
    console.log('Certificate saved. Photo in certificate object:', certificate.photo);
    
    const certificateObj = savedCertificate?.toObject ? savedCertificate.toObject() : savedCertificate;
    console.log('Certificate toObject (from reloaded):', JSON.stringify(certificateObj, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Certificate created successfully',
      certificate: certificateObj || (certificate.toObject ? certificate.toObject() : certificate)
    });

  } catch (error) {
    console.error('Error creating certificate:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create certificate' },
      { status: 500 }
    );
  }
}
