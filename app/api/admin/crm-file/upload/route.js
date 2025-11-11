import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { storageService } from '@/lib/storage';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  try {
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return true;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function POST(request) {
  try {
    // Verify admin token
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ message: authError.message }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type - only Excel files
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      return NextResponse.json({ 
        message: 'Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        message: 'File size too large. Maximum size is 50MB.' 
      }, { status: 400 });
    }

    // Upload file using storage service
    const result = await storageService.uploadFile(file, 'crm-files');

    // Store file info in a simple JSON file or database
    // For simplicity, we'll store it in a JSON file
    const fileInfo = {
      filename: result.filename,
      originalName: file.name,
      url: result.url,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      type: file.type
    };

    // Save file info to a JSON file in the crm-files directory (same as uploaded file)
    const crmFilesDir = path.join(process.cwd(), 'public', 'crm-files');
    if (!fs.existsSync(crmFilesDir)) {
      fs.mkdirSync(crmFilesDir, { recursive: true });
    }

    const infoFilePath = path.join(crmFilesDir, 'current-file.json');
    fs.writeFileSync(infoFilePath, JSON.stringify(fileInfo, null, 2));

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      message: 'Failed to upload file',
      error: error.message 
    }, { status: 500 });
  }
}

