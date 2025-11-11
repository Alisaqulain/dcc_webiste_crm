import { NextResponse } from 'next/server';
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

export async function GET(request) {
  try {
    // Verify admin token
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ message: authError.message }, { status: 401 });
    }

    // Get current file info
    const infoFilePath = path.join(process.cwd(), 'public', 'crm-files', 'current-file.json');
    
    if (!fs.existsSync(infoFilePath)) {
      return NextResponse.json({ 
        hasFile: false,
        message: 'No file uploaded yet' 
      });
    }

    const fileInfo = JSON.parse(fs.readFileSync(infoFilePath, 'utf8'));
    
    // Check if file still exists
    const filePath = path.join(process.cwd(), 'public', 'uploads', 'crm-files', fileInfo.filename);
    const fileExists = fs.existsSync(filePath);

    return NextResponse.json({
      hasFile: true,
      fileExists,
      file: fileInfo
    });

  } catch (error) {
    console.error('File info error:', error);
    return NextResponse.json({ 
      message: 'Failed to get file info',
      error: error.message 
    }, { status: 500 });
  }
}

