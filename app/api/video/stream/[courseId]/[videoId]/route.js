import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { courseId, videoId } = await params;
    const { searchParams } = new URL(request.url);
    const range = request.headers.get('range');

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectDB();

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

    // Check if user has access to this course
    const user = await User.findById(session.user.id);
    
    if (!user || !user.courses) {
      return NextResponse.json(
        { error: 'Access denied. Please purchase this course.' },
        { status: 403 }
      );
    }

    const hasAccess = user.courses.some(
      c => c.courseId && c.courseId.toString() === courseId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. Please purchase this course to watch videos.' },
        { status: 403 }
      );
    }

    // Handle different video storage methods
    // Check for filesystem-stored videos first (most common case)
    if (video.videoData && video.videoData.url && !video.videoData.isDataUrl) {
      // Video stored as file on filesystem
      try {
        // Remove leading slash if present and build path
        const urlPath = video.videoData.url.startsWith('/') ? video.videoData.url.substring(1) : video.videoData.url;
        const videoPath = join(process.cwd(), 'public', urlPath);
        
        console.log('Streaming video from filesystem:', {
          videoId,
          url: video.videoData.url,
          urlPath,
          videoPath,
          fileExists: require('fs').existsSync(videoPath)
        });

        const stats = await stat(videoPath);
        const fileSize = stats.size;
        const start = range ? parseInt(range.replace(/\D/g, '')) : 0;
        const end = Math.min(start + (1024 * 1024 * 10) - 1, fileSize - 1); // 10MB chunks for better performance
        const contentLength = end - start + 1;

        const fileBuffer = await readFile(videoPath, { start, end });
        
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.videoData.mimeType || video.mimeType || 'video/mp4',
          'Cache-Control': 'public, max-age=3600',
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-Video-Protected': 'true'
        };

        return new NextResponse(fileBuffer, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error reading video file from filesystem:', {
          error: error.message,
          code: error.code,
          path: video.videoData.url,
          stack: error.stack
        });
        return NextResponse.json(
          { error: `Video file not found: ${error.message}` },
          { status: 404 }
        );
      }
    } else if (video.videoData && video.videoData.data) {
      // Legacy base64 data (shouldn't be used anymore)
      try {
        const videoBuffer = Buffer.from(video.videoData.data, 'base64');
        const fileSize = videoBuffer.length;
        const start = range ? parseInt(range.replace(/\D/g, '')) : 0;
        const end = Math.min(start + (1024 * 1024 * 10) - 1, fileSize - 1);
        const contentLength = end - start + 1;

        const chunk = videoBuffer.slice(start, end + 1);
        
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.mimeType || 'video/mp4',
          'Cache-Control': 'no-cache',
          'X-Video-Protected': 'true'
        };

        return new NextResponse(chunk, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error processing base64 video data:', error);
        return NextResponse.json(
          { error: 'Error processing video data' },
          { status: 500 }
        );
      }
    } else if (video.videoPath) {
      // Video stored as file (legacy support)
      try {
        const videoPath = join(process.cwd(), 'public', video.videoPath);
        const stats = await stat(videoPath);
        const fileSize = stats.size;
        const start = range ? parseInt(range.replace(/\D/g, '')) : 0;
        const end = Math.min(start + 1024 * 1024, fileSize - 1); // 1MB chunks
        const contentLength = end - start + 1;

        const file = await readFile(videoPath, { start, end });
        
        const headers = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.mimeType || 'video/mp4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // Security headers to prevent screenshots/recording
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'no-referrer',
          // Custom headers for video protection
          'X-Video-Protected': 'true',
          'X-Download-Options': 'noopen',
          'X-Permitted-Cross-Domain-Policies': 'none'
        };

        return new NextResponse(file, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error reading video file:', error);
        return NextResponse.json(
          { error: 'Video file not found' },
          { status: 404 }
        );
      }
    } else {
      console.error('Video storage method not found:', {
        videoId,
        hasVideoData: !!video.videoData,
        hasVideoDataUrl: !!(video.videoData && video.videoData.url),
        isDataUrl: video.videoData?.isDataUrl,
        hasVideoPath: !!video.videoPath,
        videoData: video.videoData ? {
          hasUrl: !!video.videoData.url,
          hasData: !!video.videoData.data,
          url: video.videoData.url?.substring(0, 50)
        } : null
      });
      return NextResponse.json(
        { error: 'Video data not found. Video may not have been uploaded properly.' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { status: 500 }
    );
  }
}
