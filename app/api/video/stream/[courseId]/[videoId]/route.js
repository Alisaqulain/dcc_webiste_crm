import { NextResponse } from 'next/server';
import { stat } from 'fs/promises';
import { createReadStream } from 'fs';
import { join } from 'path';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Helper function to parse Range header
function parseRange(rangeHeader, fileSize) {
  if (!rangeHeader) return { start: 0, end: fileSize - 1 };
  
  const matches = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!matches) return { start: 0, end: fileSize - 1 };
  
  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : fileSize - 1;
  
  return { start, end: Math.min(end, fileSize - 1) };
}

export async function OPTIONS(request) {
  // Handle CORS preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(request, { params }) {
  try {
    const { courseId, videoId } = await params;
    const { searchParams } = new URL(request.url);
    const range = request.headers.get('range');
    
    console.log('Video stream request:', {
      courseId,
      videoId,
      hasRange: !!range,
      range: range?.substring(0, 50),
      timestamp: new Date().toISOString()
    });

    await connectDB();

    // Find course and video first to check if it's a preview video
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
          }
        }
      );
    }

    const video = course.videos.find(v => v._id.toString() === videoId);
    if (!video) {
      console.error('Video not found in course:', {
        courseId,
        videoId,
        courseTitle: course.title,
        totalVideos: course.videos.length,
        videoIds: course.videos.map(v => v._id.toString())
      });
      return NextResponse.json(
        { error: 'Video not found' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
          }
        }
      );
    }
    
    console.log('Video found:', {
      videoId,
      videoTitle: video.title,
      isPreview: video.isPreview,
      hasVideoData: !!video.videoData,
      videoDataUrl: video.videoData?.url,
      videoDataFileName: video.videoData?.fileName,
      isDataUrl: video.videoData?.isDataUrl,
      hasVideoPath: !!video.videoPath,
      videoPath: video.videoPath
    });

    // Check if this is a preview video (free to watch)
    const isPreviewVideo = video.isPreview === true;
    
    // Check authentication - only required for non-preview videos
    const session = await getServerSession(authOptions);
    
    if (!isPreviewVideo) {
      // For non-preview videos, authentication is required
      if (!session) {
        console.error('Video stream request without session for non-preview video:', {
          courseId,
          videoId,
          headers: {
            authorization: request.headers.get('authorization') ? 'present' : 'missing',
            cookie: request.headers.get('cookie') ? 'present' : 'missing'
          }
        });
        return NextResponse.json(
          { error: 'Authentication required' },
          { 
            status: 401,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range, Cookie',
            }
          }
        );
      }
      
      console.log('Video stream authenticated:', {
        userId: session.user.id,
        email: session.user.email,
        courseId,
        videoId
      });
      
      // Check if user has access to this course
      const user = await User.findById(session.user.id);
      
      if (!user || !user.courses) {
        return NextResponse.json(
          { error: 'Access denied. Please purchase this course.' },
          { 
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range',
            }
          }
        );
      }

      const hasAccess = user.courses.some(
        c => c.courseId && c.courseId.toString() === courseId
      );

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Access denied. Please purchase this course to watch videos.' },
          { 
            status: 403,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range',
            }
          }
        );
      }
    } else {
      // Preview videos are accessible without authentication
      console.log('Preview video access - no authentication required:', {
        courseId,
        videoId,
        videoTitle: video.title
      });
    }

    // Handle different video storage methods
    // Check for filesystem-stored videos first (most common case)
    if (video.videoData && video.videoData.url && !video.videoData.isDataUrl) {
      // Video stored as file on filesystem
      try {
        // Remove leading slash if present and build path
        let urlPath = video.videoData.url;
        
        // Handle different URL formats
        if (urlPath.startsWith('/')) {
          urlPath = urlPath.substring(1); // Remove leading slash
        }
        
        // Ensure we're looking in the public directory
        // The URL should be like "videos/filename.mp4" or "uploads/videos/filename.mp4"
        // But we need to make sure it's in public directory
        const videoPath = join(process.cwd(), 'public', urlPath);
        
        // Check if file exists, if not try alternative paths
        let fileExists = require('fs').existsSync(videoPath);
        let actualVideoPath = videoPath;
        
        // If file doesn't exist, try different path variations
        if (!fileExists) {
          const fs = require('fs');
          const path = require('path');
          
          // Get filename for fallback searches
          const filename = urlPath.split('/').pop();
          const folderFromUrl = urlPath.split('/').shift(); // e.g., "videos" from "videos/filename.mp4"
          
          // List of paths to try (in order of likelihood)
          const pathsToTry = [
            // Original path
            videoPath,
            // Without public prefix (in case URL already includes public)
            join(process.cwd(), urlPath),
            // Direct videos folder (storage service saves to public/videos/)
            join(process.cwd(), 'public', 'videos', filename),
            // Try with filename if URL path includes folder
            folderFromUrl && folderFromUrl !== filename ? join(process.cwd(), 'public', folderFromUrl, filename) : null,
            // Try uploads/videos if that's where it might be
            join(process.cwd(), 'public', 'uploads', 'videos', filename),
            // Try uploads folder
            join(process.cwd(), 'public', 'uploads', filename),
            // Try using fileName from videoData if different from URL
            video.videoData?.fileName ? join(process.cwd(), 'public', 'videos', video.videoData.fileName) : null,
            video.videoData?.fileName ? join(process.cwd(), 'public', folderFromUrl || 'videos', video.videoData.fileName) : null
          ].filter(p => p !== null); // Remove null entries
          
          // Try each path
          for (const tryPath of pathsToTry) {
            if (fs.existsSync(tryPath)) {
              actualVideoPath = tryPath;
              fileExists = true;
              console.log('Found video file at alternative path:', tryPath);
              break;
            }
          }
          
          // If still not found, list what exists in videos directory
          if (!fileExists) {
            const videosDir = join(process.cwd(), 'public', 'videos');
            try {
              if (fs.existsSync(videosDir)) {
                const filesInVideosDir = fs.readdirSync(videosDir);
                console.log('Files in videos directory:', filesInVideosDir.slice(0, 10)); // Show first 10
                console.log('Looking for filename:', filename);
                console.log('Looking for videoData fileName:', video.videoData?.fileName);
              }
            } catch (dirError) {
              console.error('Error reading videos directory:', dirError);
            }
          }
        }
        
        console.log('Streaming video from filesystem:', {
          videoId,
          url: video.videoData.url,
          urlPath,
          videoPath,
          actualVideoPath,
          fileExists,
          fileName: video.videoData.fileName
        });
        
        if (!fileExists) {
          console.error('Video file not found:', {
            videoId,
            url: video.videoData.url,
            triedPaths: [
              videoPath,
              join(process.cwd(), urlPath),
              join(process.cwd(), 'public', 'uploads', urlPath.replace(/^uploads\//, '')),
              join(process.cwd(), 'public', 'videos', urlPath.split('/').pop())
            ]
          });
          return NextResponse.json(
            { error: 'Video file not found on server' },
            { status: 404 }
          );
        }

        const stats = await stat(actualVideoPath);
        const fileSize = stats.size;
        const { start, end: requestedEnd } = parseRange(range, fileSize);
        
        // Ensure valid range
        const validStart = Math.max(0, Math.min(start, fileSize - 1));
        const validEnd = Math.max(validStart, Math.min(requestedEnd, fileSize - 1));
        
        // Optimize chunk size for faster initial loading and reduced buffering
        // For initial load (start=0), send much larger chunk (20-25MB) for faster playback start
        // For subsequent requests, use larger chunks (15MB) to reduce buffering interruptions
        const isInitialLoad = validStart === 0;
        const initialChunkSize = 25 * 1024 * 1024; // 25MB for initial load
        const subsequentChunkSize = 15 * 1024 * 1024; // 15MB for subsequent requests
        
        // Calculate preferred chunk size based on position
        const preferredChunkSize = isInitialLoad ? initialChunkSize : subsequentChunkSize;
        const maxPreferredEnd = Math.min(validStart + preferredChunkSize - 1, fileSize - 1);
        
        // Allow browser to request up to 20MB if needed (for seeking or aggressive buffering)
        const maxAllowedEnd = Math.min(validStart + 20 * 1024 * 1024 - 1, fileSize - 1);
        
        // Use browser's requested end if reasonable, otherwise use preferred chunk size
        // This gives browser control while ensuring we send enough data
        const end = validEnd <= maxAllowedEnd ? Math.min(validEnd, maxPreferredEnd) : maxPreferredEnd;
        
        // Ensure start <= end and end < fileSize
        if (end < validStart) {
          // Invalid: start is after end, return empty response
          return new NextResponse(null, {
            status: 416, // Range Not Satisfiable
            headers: {
              'Content-Range': `bytes */${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range'
            }
          });
        }
        
        // Ensure we don't read past the file
        const finalEnd = Math.min(end, fileSize - 1);
        
        const contentLength = finalEnd - validStart + 1;

        // Use streaming response for better performance and lower memory usage
        // This allows data to start flowing to the client immediately
        const fileStream = createReadStream(actualVideoPath, { 
          start: validStart, 
          end: finalEnd 
        });
        
        // Convert Node.js stream to Web ReadableStream for better performance
        const readableStream = new ReadableStream({
          start(controller) {
            fileStream.on('data', (chunk) => {
              controller.enqueue(new Uint8Array(chunk));
            });
            fileStream.on('end', () => {
              controller.close();
            });
            fileStream.on('error', (err) => {
              controller.error(err);
            });
          },
          cancel() {
            fileStream.destroy();
          }
        });
        
        const headers = {
          'Content-Range': `bytes ${validStart}-${finalEnd}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.videoData.mimeType || video.mimeType || 'video/mp4',
          'Cache-Control': 'public, max-age=3600',
          // CORS headers for video streaming
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
          // Security headers
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-Video-Protected': 'true'
        };

        return new NextResponse(readableStream, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error reading video file from filesystem:', {
          error: error.message,
          code: error.code,
          url: video.videoData.url,
          fileName: video.videoData.fileName,
          videoId,
          courseId,
          videoTitle: video.title,
          triedPaths: [
            join(process.cwd(), 'public', video.videoData.url.startsWith('/') ? video.videoData.url.substring(1) : video.videoData.url),
            join(process.cwd(), video.videoData.url.startsWith('/') ? video.videoData.url.substring(1) : video.videoData.url),
            join(process.cwd(), 'public', 'videos', video.videoData.fileName || video.videoData.url.split('/').pop())
          ],
          stack: error.stack
        });
        
        // Return with CORS headers even on error
        return NextResponse.json(
          { 
            error: `Video file not found: ${error.message}`,
            details: {
              url: video.videoData.url,
              fileName: video.videoData.fileName,
              videoId
            }
          },
          { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range',
            }
          }
        );
      }
    } else if (video.videoData && video.videoData.data) {
      // Legacy base64 data (shouldn't be used anymore)
      try {
        const videoBuffer = Buffer.from(video.videoData.data, 'base64');
        const fileSize = videoBuffer.length;
        const { start, end: requestedEnd } = parseRange(range, fileSize);
        
        // Ensure valid range
        const validStart = Math.max(0, Math.min(start, fileSize - 1));
        const validEnd = Math.max(validStart, Math.min(requestedEnd, fileSize - 1));
        
        // Optimize chunk size for faster loading - base64 videos need larger initial chunks
        const isInitialLoad = validStart === 0;
        const initialChunkSize = 25 * 1024 * 1024; // 25MB for initial load
        const subsequentChunkSize = 15 * 1024 * 1024; // 15MB for subsequent requests
        const preferredChunkSize = isInitialLoad ? initialChunkSize : subsequentChunkSize;
        const maxPreferredEnd = Math.min(validStart + preferredChunkSize - 1, fileSize - 1);
        const maxAllowedEnd = Math.min(validStart + 20 * 1024 * 1024 - 1, fileSize - 1);
        // Use browser's requested end if reasonable, otherwise use preferred chunk size
        const end = validEnd <= maxAllowedEnd ? Math.min(validEnd, maxPreferredEnd) : maxPreferredEnd;
        
        // Ensure valid range
        if (end < validStart || end >= fileSize) {
          throw new Error(`Invalid range: start=${validStart}, end=${end}, fileSize=${fileSize}`);
        }

        const contentLength = end - validStart + 1;

        const chunk = videoBuffer.slice(validStart, end + 1);
        
        const headers = {
          'Content-Range': `bytes ${validStart}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.mimeType || 'video/mp4',
          'Cache-Control': 'no-cache',
          // CORS headers for video streaming
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
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
          { 
            status: 500,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range',
            }
          }
        );
      }
    } else if (video.videoPath) {
      // Video stored as file (legacy support)
      try {
        const videoPath = join(process.cwd(), 'public', video.videoPath);
        const stats = await stat(videoPath);
        const fileSize = stats.size;
        const { start, end: requestedEnd } = parseRange(range, fileSize);
        
        // Ensure valid range
        const validStart = Math.max(0, Math.min(start, fileSize - 1));
        const validEnd = Math.max(validStart, Math.min(requestedEnd, fileSize - 1));
        
        // Optimize chunk size for faster loading - legacy videos need larger initial chunks
        const isInitialLoad = validStart === 0;
        const initialChunkSize = 25 * 1024 * 1024; // 25MB for initial load
        const subsequentChunkSize = 15 * 1024 * 1024; // 15MB for subsequent requests
        const preferredChunkSize = isInitialLoad ? initialChunkSize : subsequentChunkSize;
        const maxPreferredEnd = Math.min(validStart + preferredChunkSize - 1, fileSize - 1);
        const maxAllowedEnd = Math.min(validStart + 20 * 1024 * 1024 - 1, fileSize - 1);
        // Use browser's requested end if reasonable, otherwise use preferred chunk size
        const end = validEnd <= maxAllowedEnd ? Math.min(validEnd, maxPreferredEnd) : maxPreferredEnd;
        
        // Ensure valid range
        if (end < validStart || end >= fileSize) {
          throw new Error(`Invalid range: start=${validStart}, end=${end}, fileSize=${fileSize}`);
        }

        const contentLength = end - validStart + 1;

        // Use streaming response for better performance
        const fileStream = createReadStream(videoPath, { 
          start: validStart, 
          end: end 
        });
        
        // Convert Node.js stream to Web ReadableStream for better performance
        const readableStream = new ReadableStream({
          start(controller) {
            fileStream.on('data', (chunk) => {
              controller.enqueue(new Uint8Array(chunk));
            });
            fileStream.on('end', () => {
              controller.close();
            });
            fileStream.on('error', (err) => {
              controller.error(err);
            });
          },
          cancel() {
            fileStream.destroy();
          }
        });
        
        const headers = {
          'Content-Range': `bytes ${validStart}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': contentLength.toString(),
          'Content-Type': video.mimeType || 'video/mp4',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          // CORS headers for video streaming
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
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

        return new NextResponse(readableStream, {
          status: range ? 206 : 200,
          headers
        });

      } catch (error) {
        console.error('Error reading video file:', error);
        return NextResponse.json(
          { error: 'Video file not found' },
          { 
            status: 404,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
              'Access-Control-Allow-Headers': 'Range',
            }
          }
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
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
            'Access-Control-Allow-Headers': 'Range',
          }
        }
      );
    }

  } catch (error) {
    console.error('Video streaming error:', error);
    return NextResponse.json(
      { error: 'Failed to stream video' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range',
        }
      }
    );
  }
}
