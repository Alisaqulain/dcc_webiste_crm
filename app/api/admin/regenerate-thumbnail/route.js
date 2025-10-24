import { NextResponse } from 'next/server';
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
    
    const { courseId, videoId } = await request.json();

    if (!courseId || !videoId) {
      return NextResponse.json(
        { error: 'Course ID and Video ID are required' },
        { status: 400 }
      );
    }

    // Find course and video
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const video = course.videos.find(v => v._id.toString() === videoId);
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    if (!video.videoPath) {
      return NextResponse.json(
        { error: 'Video file not found - only uploaded videos can have thumbnails regenerated' },
        { status: 400 }
      );
    }

    // Generate new thumbnail
    try {
      const videoFilePath = join(process.cwd(), 'public', video.videoPath);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const thumbnailFileName = `regenerated_${timestamp}_${randomString}.jpg`;
      const thumbnailDir = join(process.cwd(), 'public', 'uploads', 'thumbnails');
      const thumbnailFullPath = join(thumbnailDir, thumbnailFileName);
      
      // Check if FFmpeg is available
      const ffmpegAvailable = await isFFmpegAvailable();
      let thumbnailPath;
      
      if (ffmpegAvailable) {
        await generateVideoThumbnail(videoFilePath, thumbnailFullPath);
        thumbnailPath = `/uploads/thumbnails/${thumbnailFileName}`;
        console.log('FFmpeg thumbnail regenerated:', thumbnailPath);
      } else {
        console.log('FFmpeg not available, using fallback thumbnail');
        const fallbackPath = await generateVideoThumbnailFallback(videoFilePath, thumbnailFullPath);
        thumbnailPath = fallbackPath.replace('/public', '');
        console.log('Fallback thumbnail regenerated:', thumbnailPath);
      }
      
      // Update video with new thumbnail
      video.thumbnail = thumbnailPath;
      await course.save();

      return NextResponse.json({
        success: true,
        message: 'Thumbnail regenerated successfully',
        thumbnail: thumbnailPath
      });

    } catch (thumbnailError) {
      console.error('Error regenerating thumbnail:', thumbnailError);
      return NextResponse.json(
        { error: 'Failed to regenerate thumbnail: ' + thumbnailError.message },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Thumbnail regeneration error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate thumbnail' },
      { status: 500 }
    );
  }
}
