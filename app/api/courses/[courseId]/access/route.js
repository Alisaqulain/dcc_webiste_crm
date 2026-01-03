import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/courses/[courseId]/access
 * 
 * Check if the current user has access to a course
 * Returns: { hasAccess: boolean }
 */
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { courseId } = await params;
    const session = await getServerSession(authOptions);

    // Find the course
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return Response.json(
        { hasAccess: false, message: 'Course not found' },
        { status: 404 }
      );
    }

    // If user is not logged in, only allow preview videos
    if (!session?.user) {
      return Response.json({ hasAccess: false });
    }

    // Find user
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return Response.json({ hasAccess: false });
    }

    // Check if user has purchased this course
    const hasPurchased = user.courses?.some(
      c => c.courseId && c.courseId.toString() === courseId
    );

    return Response.json({ hasAccess: hasPurchased });
  } catch (error) {
    console.error('Error checking course access:', error);
    return Response.json(
      { hasAccess: false, message: 'Error checking access' },
      { status: 500 }
    );
  }
}







