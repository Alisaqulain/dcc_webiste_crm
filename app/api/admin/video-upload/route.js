import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';
import { storageService } from '@/lib/storage';

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

export async function POST(request) {
  try {
    console.log('Video upload request started');
    
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      console.log('Auth error:', authError.message);
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }
    
    try {
      await connectDB();
      console.log('Database connected');
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    console.log('Parsing form data...');
    let formData;
    try {
      console.log('Starting form data parsing...');
      
      // Check content length first
      const contentLength = request.headers.get('content-length');
      console.log('Content-Length header:', contentLength);
      
      if (contentLength) {
        const sizeInMB = parseInt(contentLength) / (1024 * 1024);
        console.log('Request size:', sizeInMB.toFixed(2) + 'MB');
        
        if (sizeInMB > 100) {
          console.log('Request too large based on Content-Length header');
          return NextResponse.json(
            { error: 'Video file is too large. Please use a video smaller than 100MB or compress it.' },
            { status: 413 }
          );
        }
      }
      
      formData = await request.formData();
      console.log('Form data parsed successfully');
    } catch (parseError) {
      console.error('Form data parsing error:', parseError);
      console.error('Parse error details:', {
        message: parseError.message,
        name: parseError.name,
        stack: parseError.stack
      });
      
      if (parseError.message.includes('413') || parseError.message.includes('Payload Too Large')) {
        console.log('413 error detected during form parsing');
        return NextResponse.json(
          { error: 'Video file is too large. Please use a video smaller than 100MB or compress it.' },
          { status: 413 }
        );
      }
      return NextResponse.json(
        { error: 'Error parsing form data: ' + parseError.message },
        { status: 400 }
      );
    }
    const file = formData.get('video');
    const thumbnailFile = formData.get('thumbnail');
    const courseId = formData.get('courseId');
    const title = formData.get('title');
    const description = formData.get('description');
    const duration = formData.get('duration');
    const isPreview = formData.get('isPreview') === 'true';

    // Debug logging
    console.log('Video upload request received:', {
      hasFile: !!file,
      fileSize: file ? file.size : 0,
      fileType: file ? file.type : 'none',
      fileSizeMB: file ? (file.size / (1024 * 1024)).toFixed(2) + 'MB' : '0MB',
      fileName: file ? file.name : 'none',
      courseId,
      title,
      description,
      duration,
      isPreview
    });

    // Additional file debugging
    if (file) {
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        sizeInBytes: file.size,
        sizeInKB: (file.size / 1024).toFixed(2),
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      });
    }

    if (!file || !courseId || !title || !duration) {
      console.log('Missing required fields:', {
        hasFile: !!file,
        courseId,
        title,
        duration
      });
      return NextResponse.json(
        { error: 'Missing required fields: video file, courseId, title, and duration are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Only video files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB for now to avoid 413 errors)
    const maxSize = 100 * 1024 * 1024; // 100MB
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    console.log('API file size validation:', {
      fileSize: file.size,
      fileSizeMB: fileSizeMB,
      maxSize: maxSize,
      maxSizeMB: '100MB',
      isOverLimit: file.size > maxSize
    });
    
    if (file.size > maxSize) {
      console.log('File rejected for being too large:', fileSizeMB + 'MB');
      return NextResponse.json(
        { error: `File size too large. Your file is ${fileSizeMB}MB, but maximum size is 100MB. Please compress your video or use a smaller file.` },
        { status: 400 }
      );
    }

    // Upload video using storage service
    const videoUploadResult = await storageService.uploadFile(file, 'videos');
    
    // Create simple video data structure
    const videoData = {
      fileName: videoUploadResult.filename,
      mimeType: file.type,
      size: file.size,
      url: videoUploadResult.url,
      isDataUrl: videoUploadResult.isDataUrl
    };

    console.log('Video uploaded successfully:', {
      title,
      fileName: videoData.fileName,
      hasUrl: !!videoData.url,
      size: videoData.size
    });

    // Handle thumbnail
    let thumbnailData = null;
    
    if (thumbnailFile) {
      // Use custom uploaded thumbnail
      try {
        const thumbnailUploadResult = await storageService.uploadFile(thumbnailFile, 'thumbnails');
        
        thumbnailData = {
          fileName: thumbnailUploadResult.filename,
          mimeType: thumbnailFile.type,
          size: thumbnailFile.size,
          url: thumbnailUploadResult.url,
          isDataUrl: thumbnailUploadResult.isDataUrl
        };
        
        console.log('Custom thumbnail processed');
      } catch (thumbnailError) {
        console.error('Error processing custom thumbnail:', thumbnailError);
        // Continue without thumbnail - don't fail the upload
      }
    } else {
      // For deployment, we'll skip thumbnail generation for now
      // In production, you should use a cloud service for thumbnail generation
      console.log('Thumbnail generation skipped in deployment mode');
    }

    // Find course and add video
    console.log('Looking for course with ID:', courseId);
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('Course not found with ID:', courseId);
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    console.log('Course found:', course.title);

    // Get the next order number
    const nextOrder = course.videos.length > 0 
      ? Math.max(...course.videos.map(v => v.order)) + 1 
      : 1;

    const newVideo = {
      title,
      description: description || '',
      videoData: videoData,
      thumbnailData: thumbnailData,
      duration,
      order: nextOrder,
      isPreview,
      uploadedAt: new Date(),
      fileSize: file.size,
      mimeType: file.type
    };

    console.log('Creating new video:', {
      title: newVideo.title,
      description: newVideo.description,
      duration: newVideo.duration,
      hasVideoData: !!newVideo.videoData
    });

    course.videos.push(newVideo);
    await course.save();

    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      video: newVideo
    });

  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}
