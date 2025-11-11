import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { storageService } from '@/lib/storage';
import jwt from 'jsonwebtoken';

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

export async function POST(request) {
  try {
    // Verify admin token
    try {
      const decoded = verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file');
    const userId = formData.get('userId');

    if (!file) {
      return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
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

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has purchased CRM course
    const Course = (await import('@/models/Course')).default;
    if (!user.courses || user.courses.length === 0) {
      return NextResponse.json({ message: 'User has not purchased any courses' }, { status: 400 });
    }

    const courseIds = user.courses.map(c => c.courseId);
    const crmCourses = await Course.find({
      _id: { $in: courseIds },
      hasCrmAccess: true
    });

    if (crmCourses.length === 0) {
      return NextResponse.json({ message: 'User has not purchased any CRM courses' }, { status: 400 });
    }

    // Upload file using storage service - force filesystem mode (same as videos/images)
    // This ensures consistent storage behavior across all file types
    const userFolder = `crm-files/users/${userId}`;
    
    // Temporarily force filesystem mode for CRM files
    const originalIsServerless = storageService.isServerless;
    storageService.isServerless = false; // Force filesystem
    
    const result = await storageService.uploadFile(file, userFolder);
    
    // Restore original setting
    storageService.isServerless = originalIsServerless;
    
    console.log('File uploaded using storage service:', {
      filename: result.filename,
      url: result.url,
      originalName: file.name,
      size: result.size || file.size,
      isDataUrl: result.isDataUrl || false
    });
    
    // Ensure we have a file path, not a data URL
    if (result.isDataUrl) {
      throw new Error('Storage service returned data URL instead of file path. This should not happen.');
    }

    // Store file info in user document (use file path from storage service)
    const fileData = {
      filename: result.filename,
      originalName: file.name,
      url: result.url,
      uploadedAt: new Date(),
      size: result.size || file.size,
      type: file.type
    };

    // Use MongoDB native driver for direct update (bypass Mongoose)
    let saveSuccess = false;
    let lastError = null;
    
    try {
      console.log('Attempting to save file data using MongoDB native driver...');
      console.log('File data:', JSON.stringify(fileData, null, 2));
      console.log('User ID:', userId);
      
      // Get MongoDB connection - ensure it's connected
      const mongoose = await import('mongoose');
      if (!mongoose.connection.readyState) {
        await connectDB();
      }
      
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('MongoDB database connection not available');
      }
      
      const usersCollection = db.collection('users');
      
      // Convert userId to ObjectId
      const ObjectId = mongoose.default.Types.ObjectId;
      const userObjectId = new ObjectId(userId);
      
      // Direct MongoDB update - add to crmFiles array and also update crmFile for backward compatibility
      const updateResult = await usersCollection.updateOne(
        { _id: userObjectId },
        { 
          $push: { 
            crmFiles: fileData
          },
          $set: { 
            crmFile: fileData, // Keep for backward compatibility
            updatedAt: new Date()
          } 
        }
      );
      
      console.log('MongoDB native update result:', {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        acknowledged: updateResult.acknowledged,
        upsertedCount: updateResult.upsertedCount
      });
      
      if (updateResult.modifiedCount > 0 || updateResult.matchedCount > 0) {
        // Verify the update worked
        const verifyUser = await usersCollection.findOne({ _id: userObjectId });
        console.log('Verification - User crmFiles from DB:', JSON.stringify(verifyUser?.crmFiles, null, 2));
        console.log('Verification - User crmFile from DB:', JSON.stringify(verifyUser?.crmFile, null, 2));
        console.log('Verification - Full user document keys:', Object.keys(verifyUser || {}));
        
        if (verifyUser?.crmFiles && verifyUser.crmFiles.length > 0 && verifyUser.crmFiles[verifyUser.crmFiles.length - 1]?.filename) {
          saveSuccess = true;
          console.log('SUCCESS: File saved using MongoDB native driver!');
        } else if (verifyUser?.crmFile?.filename) {
          saveSuccess = true;
          console.log('SUCCESS: File saved (backward compatibility mode)!');
        } else {
          console.log('WARNING: Update acknowledged but file not found in verification');
          console.log('User document structure:', JSON.stringify(verifyUser, null, 2));
        }
      } else {
        console.log('WARNING: Update returned 0 modified documents');
        // Check if user exists
        const checkUser = await usersCollection.findOne({ _id: userObjectId });
        if (!checkUser) {
          console.error('ERROR: User not found in database!');
        } else {
          console.log('User exists but update did not modify document');
          console.log('Current user crmFile:', checkUser.crmFile);
        }
      }
      
    } catch (err) {
      lastError = err;
      console.error('MongoDB native update ERROR:', err.message);
      console.error('Error stack:', err.stack);
      
      // Fallback to Mongoose updateOne
      try {
        console.log('Falling back to Mongoose updateOne...');
        const updateResult = await User.updateOne(
          { _id: userId },
          { 
            $set: { 
              crmFile: fileData
            } 
          }
        );
        
        console.log('Mongoose fallback result:', {
          matchedCount: updateResult.matchedCount,
          modifiedCount: updateResult.modifiedCount,
          acknowledged: updateResult.acknowledged
        });
        
        const verifyUser = await User.findById(userId);
        if (verifyUser?.crmFile?.filename) {
          saveSuccess = true;
          console.log('SUCCESS: File saved using Mongoose fallback!');
        } else {
          console.log('Mongoose fallback verification failed');
          console.log('User crmFile:', verifyUser?.crmFile);
        }
      } catch (fallbackErr) {
        console.error('Mongoose fallback also failed:', fallbackErr.message);
        console.error('Fallback error stack:', fallbackErr.stack);
      }
    }

    // Final verification using native driver (Mongoose might cache)
    let finalVerification = false;
    try {
      const mongoose = await import('mongoose');
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      const ObjectId = mongoose.default.Types.ObjectId;
      const userObjectId = new ObjectId(userId);
      
      const verifyUser = await usersCollection.findOne({ _id: userObjectId });
      const latestFile = verifyUser?.crmFiles && verifyUser.crmFiles.length > 0 
        ? verifyUser.crmFiles[verifyUser.crmFiles.length - 1]
        : verifyUser?.crmFile;
      
      console.log('Final verification (native driver):', {
        hasCrmFiles: !!verifyUser?.crmFiles && verifyUser.crmFiles.length > 0,
        filesCount: verifyUser?.crmFiles?.length || 0,
        hasCrmFile: !!verifyUser?.crmFile,
        latestFile: latestFile ? JSON.stringify(latestFile, null, 2) : 'null'
      });
      
      if (latestFile?.filename) {
        finalVerification = true;
        saveSuccess = true;
      }
    } catch (verifyErr) {
      console.error('Final verification error:', verifyErr.message);
    }

    if (!saveSuccess || !finalVerification) {
      console.error('ERROR: File save verification failed!');
      console.error('Last error:', lastError?.message || 'No error thrown');
      console.error('File data that was attempted:', JSON.stringify(fileData, null, 2));
      
      return NextResponse.json({ 
        message: 'File uploaded but failed to save file info to user account. The file was uploaded to storage but could not be linked to the user. Please try again or contact support.',
        error: lastError?.message || 'Database save verification failed',
        debug: {
          userId: userId,
          fileUploaded: true,
          fileSaved: saveSuccess,
          verificationPassed: finalVerification,
          lastError: lastError?.message
        }
      }, { status: 500 });
    }
    
    console.log('SUCCESS: File info saved to user account and verified!');

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully for user',
      file: {
        filename: result.filename,
        originalName: file.name,
        url: result.url,
        uploadedAt: fileData.uploadedAt,
        size: result.size || file.size
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ 
      message: 'Failed to upload file',
      error: error.message 
    }, { status: 500 });
  }
}

