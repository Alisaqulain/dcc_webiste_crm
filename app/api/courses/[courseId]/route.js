import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { courseId } = await params;
    const url = new URL(request.url);
    const includeVideos = url.searchParams.get('includeVideos') === 'true';
    
    const session = await getServerSession(authOptions);

    // Purchased / enrolled (used for video list + client purchase CTA)
    let hasAccess = false;
    if (session?.user?.id) {
      const user = await User.findById(session.user.id).select('courses').lean();
      if (user?.courses?.length) {
        hasAccess = user.courses.some(
          (c) => c.courseId && c.courseId.toString() === courseId
        );
      }
    }
    
    // Include videos if user has access and requested, OR if includeVideos is true (to show preview videos)
    let course;
    if (includeVideos) {
      course = await Course.findById(courseId).lean();
      // Sort videos by order
      if (course.videos) {
        course.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // If user doesn't have access, filter to show only free preview videos
        if (!hasAccess) {
          course.videos = course.videos.filter(v => v.isFreePreview === true || v.isPreview === true);
        }
      }
      if (course.materials) {
        course.materials.sort((a, b) => (a.order || 0) - (b.order || 0));
        if (!hasAccess) {
          course.materials = course.materials.filter((m) => m.isFreePreview === true);
        }
      }
    } else {
      course = await Course.findById(courseId)
        .select('-videos') // Exclude videos for performance
        .lean();
    }

    if (!course) {
      return Response.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    return Response.json({ course, hasAccess });
  } catch (error) {
    console.error('Error fetching course:', error);
    return Response.json(
      { message: 'Error fetching course' },
      { status: 500 }
    );
  }
}
