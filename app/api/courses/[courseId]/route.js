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
    
    // Check if user is authenticated and has purchased the course
    let hasAccess = false;
    const session = await getServerSession(authOptions);
    
    if (session && includeVideos) {
      const user = await User.findById(session.user.id);
      if (user && user.courses) {
        hasAccess = user.courses.some(
          c => c.courseId && c.courseId.toString() === courseId
        );
      }
    }
    
    // Include videos only if user has access and requested
    let course;
    if (hasAccess && includeVideos) {
      course = await Course.findById(courseId).lean();
      // Sort videos by order
      if (course.videos) {
        course.videos.sort((a, b) => (a.order || 0) - (b.order || 0));
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

    return Response.json({ course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return Response.json(
      { message: 'Error fetching course' },
      { status: 500 }
    );
  }
}
