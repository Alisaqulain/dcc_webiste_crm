import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import jwt from 'jsonwebtoken';
import { generateVideoThumbnail } from '@/lib/videoThumbnail';
import { generateVideoThumbnailFallback, isFFmpegAvailable } from '@/lib/videoThumbnailFallback';

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
    verifyAdminToken(request);
    
    await connectDB();
    
    const formData = await request.formData();
    const file = formData.get('video');
    const thumbnailFile = formData.get('thumbnail');
    const courseId = formData.get('courseId');
    const title = formData.get('title');
    const description = formData.get('description');
    const duration = formData.get('duration');
    const isPreview = formData.get('isPreview') === 'true';

    if (!file || !courseId || !title || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'videos');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Handle thumbnail
    let thumbnailPath = null;
    
    if (thumbnailFile) {
      // Use custom uploaded thumbnail
      try {
        const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'thumbnails');
        const thumbnailFileName = `custom_${timestamp}_${randomString}.${thumbnailFile.name.split('.').pop()}`;
        const thumbnailFullPath = join(thumbnailDir, thumbnailFileName);
        
        // Save custom thumbnail
        const thumbnailBytes = await thumbnailFile.arrayBuffer();
        const thumbnailBuffer = Buffer.from(thumbnailBytes);
        await writeFile(thumbnailFullPath, thumbnailBuffer);
        
        thumbnailPath = `/uploads/thumbnails/${thumbnailFileName}`;
        console.log('Custom thumbnail uploaded:', thumbnailPath);
      } catch (thumbnailError) {
        console.error('Error saving custom thumbnail:', thumbnailError);
        // Continue without thumbnail - don't fail the upload
      }
    } else {
      // Generate thumbnail from video
      try {
        const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'thumbnails');
        const thumbnailFileName = `${timestamp}_${randomString}.jpg`;
        const thumbnailFullPath = join(thumbnailDir, thumbnailFileName);
        
        // Check if FFmpeg is available
        const ffmpegAvailable = await isFFmpegAvailable();
        
        if (ffmpegAvailable) {
          await generateVideoThumbnail(filePath, thumbnailFullPath);
          thumbnailPath = `/uploads/thumbnails/${thumbnailFileName}`;
          console.log('FFmpeg thumbnail generated:', thumbnailPath);
        } else {
          console.log('FFmpeg not available, using fallback thumbnail');
          const fallbackPath = await generateVideoThumbnailFallback(filePath, thumbnailFullPath);
          thumbnailPath = fallbackPath.replace('/public', '');
          console.log('Fallback thumbnail generated:', thumbnailPath);
        }
      } catch (thumbnailError) {
        console.error('Error generating thumbnail:', thumbnailError);
        // Continue without thumbnail - don't fail the upload
      }
    }

    // Find course and add video
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Get the next order number
    const nextOrder = course.videos.length > 0 
      ? Math.max(...course.videos.map(v => v.order)) + 1 
      : 1;

    const newVideo = {
      title,
      description: description || '',
      videoPath: `/uploads/videos/${fileName}`,
      youtubeUrl: undefined, // Explicitly set to undefined for uploaded videos
      thumbnail: thumbnailPath,
      duration,
      order: nextOrder,
      isPreview,
      uploadedAt: new Date(),
      fileSize: file.size,
      mimeType: file.type
    };

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
