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
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }
    
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const formData = await request.formData();
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
      courseId,
      title,
      description,
      duration,
      isPreview
    });

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

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 500MB' },
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
