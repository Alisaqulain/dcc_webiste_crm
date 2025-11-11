import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    await connectDB();

    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user using native MongoDB driver (Mongoose might not return nested objects correctly)
    const mongoose = await import('mongoose');
    if (!mongoose.connection.readyState) {
      await connectDB();
    }
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    let user = null;
    if (session.user.id) {
      const ObjectId = mongoose.default.Types.ObjectId;
      user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
    } else if (session.user.email) {
      user = await usersCollection.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has files assigned
    const hasFiles = (user.crmFiles && user.crmFiles.length > 0) || (user.crmFile && user.crmFile.filename);
    
    console.log('Checking files for user (native driver):', {
      userId: user._id,
      email: user.email,
      hasCrmFiles: !!(user.crmFiles && user.crmFiles.length > 0),
      filesCount: user.crmFiles?.length || 0,
      hasCrmFile: !!user.crmFile,
      crmFiles: user.crmFiles ? JSON.stringify(user.crmFiles, null, 2) : 'null',
      crmFile: user.crmFile ? JSON.stringify(user.crmFile, null, 2) : 'null'
    });

    if (!hasFiles) {
      return NextResponse.json({ 
        hasFile: false,
        message: 'No file uploaded yet for your account' 
      });
    }

    // Return all files (prefer crmFiles array, fallback to crmFile for backward compatibility)
    const files = user.crmFiles && user.crmFiles.length > 0 
      ? user.crmFiles 
      : (user.crmFile ? [user.crmFile] : []);
    
    console.log('Files found:', JSON.stringify(files, null, 2));
    
    // Check if files still exist and add fileExists status
    const filesWithStatus = files.map(fileInfo => {
      let filePath;
      let fileExists = false;
      
      if (fileInfo.url && !fileInfo.url.startsWith('data:')) {
        // File is stored on filesystem
        const urlPath = fileInfo.url.startsWith('/') ? fileInfo.url : `/${fileInfo.url}`;
        filePath = path.join(process.cwd(), 'public', urlPath);
        fileExists = fs.existsSync(filePath);
      } else if (fileInfo.filename) {
        // Try user-specific path
        const userIdStr = user._id.toString ? user._id.toString() : String(user._id);
        const userFilePath = path.join(process.cwd(), 'public', 'crm-files', 'users', userIdStr, fileInfo.filename);
        const oldPath = path.join(process.cwd(), 'public', 'crm-files', fileInfo.filename);
        if (fs.existsSync(userFilePath)) {
          filePath = userFilePath;
          fileExists = true;
        } else if (fs.existsSync(oldPath)) {
          filePath = oldPath;
          fileExists = true;
        }
      }
      
      return {
        ...fileInfo,
        fileExists
      };
    });

    return NextResponse.json({
      hasFile: true,
      files: filesWithStatus,
      file: filesWithStatus[filesWithStatus.length - 1], // Latest file for backward compatibility
      fileExists: filesWithStatus.some(f => f.fileExists) // At least one file exists
    });

  } catch (error) {
    console.error('File info error:', error);
    return NextResponse.json({ 
      message: 'Failed to get file info',
      error: error.message 
    }, { status: 500 });
  }
}

