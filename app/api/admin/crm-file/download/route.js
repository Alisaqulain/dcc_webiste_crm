import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    await connectDB();

    // Get user session (for regular users, not admin)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get file identifier from query params
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId'); // Can be _id, filename, or url
    const fileUrl = searchParams.get('url');

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

    // Check if user has purchased CRM course
    if (!user.courses || user.courses.length === 0) {
      return NextResponse.json({ message: 'No courses purchased' }, { status: 403 });
    }

    const courseIds = user.courses.map(c => c.courseId);
    const crmCourses = await Course.find({
      _id: { $in: courseIds },
      hasCrmAccess: true
    });

    if (crmCourses.length === 0) {
      return NextResponse.json({ message: 'CRM course not purchased' }, { status: 403 });
    }

    // Find the specific file to download
    let fileInfo = null;
    let fileIndex = -1;
    
    // First, try to find in crmFiles array
    if (user.crmFiles && user.crmFiles.length > 0) {
      if (fileId) {
        // Find by _id or filename
        fileIndex = user.crmFiles.findIndex(f => 
          (f._id && f._id.toString() === fileId) || 
          f.filename === fileId || 
          f.originalName === fileId
        );
      } else if (fileUrl) {
        // Find by URL
        fileIndex = user.crmFiles.findIndex(f => f.url === fileUrl);
      } else {
        // Default to latest file
        fileIndex = user.crmFiles.length - 1;
      }
      
      if (fileIndex >= 0) {
        fileInfo = user.crmFiles[fileIndex];
      }
    }
    
    // Fallback to crmFile for backward compatibility
    if (!fileInfo && user.crmFile && user.crmFile.filename) {
      fileInfo = user.crmFile;
    }

    if (!fileInfo || !fileInfo.filename) {
      return NextResponse.json({ message: 'No file available for download' }, { status: 404 });
    }
    
    // Determine file path based on storage method
    let filePath;
    if (fileInfo.url && !fileInfo.url.startsWith('data:')) {
      // File is stored on filesystem, URL format: /crm-files/users/userId/filename
      const urlPath = fileInfo.url.startsWith('/') ? fileInfo.url : `/${fileInfo.url}`;
      filePath = path.join(process.cwd(), 'public', urlPath);
    } else if (fileInfo.filename) {
      // Try user-specific path first
      const userIdStr = user._id.toString ? user._id.toString() : String(user._id);
      const userFilePath = path.join(process.cwd(), 'public', 'crm-files', 'users', userIdStr, fileInfo.filename);
      // Fallback to old path structure
      const oldPath = path.join(process.cwd(), 'public', 'crm-files', fileInfo.filename);
      filePath = fs.existsSync(userFilePath) ? userFilePath : oldPath;
    } else {
      return NextResponse.json({ message: 'Invalid file info' }, { status: 400 });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'File not found on server' }, { status: 404 });
    }

    // Update user's download status for the specific file
    if (fileIndex >= 0 && user.crmFiles && user.crmFiles[fileIndex]) {
      // Update specific file in crmFiles array
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            [`crmFiles.${fileIndex}.downloaded`]: true,
            [`crmFiles.${fileIndex}.downloadedAt`]: new Date(),
            crmFileDownloaded: true, // Keep for backward compatibility
            crmFileDownloadedAt: new Date()
          } 
        }
      );
    } else {
      // Update general download status (backward compatibility)
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            crmFileDownloaded: true,
            crmFileDownloadedAt: new Date()
          } 
        }
      );
    }

    // Read and return file
    const fileBuffer = fs.readFileSync(filePath);
    const fileExtension = path.extname(fileInfo.originalName || fileInfo.filename).toLowerCase();
    const contentType = fileExtension === '.csv' 
      ? 'text/csv' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileInfo.originalName || fileInfo.filename}"`,
        'Content-Length': fileBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('File download error:', error);
    return NextResponse.json({ 
      message: 'Failed to download file',
      error: error.message 
    }, { status: 500 });
  }
}

