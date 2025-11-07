import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try { 
    await connectDB();
    
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Find user by ID or email (fallback)
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id).select('courses');
    } else if (session.user.email) {
      user = await User.findOne({ email: session.user.email }).select('courses');
    }

    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }
    
    if (!user.courses || user.courses.length === 0) {
      return Response.json({ hasCrmAccess: false });
    }

    // Get course IDs from user's purchased courses
    const courseIds = user.courses.map(c => c.courseId);

    // Check if any of the purchased courses have CRM access
    const coursesWithCrmAccess = await Course.find({
      _id: { $in: courseIds },
      hasCrmAccess: true
    }).select('_id title hasCrmAccess');

    const hasCrmAccess = coursesWithCrmAccess.length > 0;

    return Response.json({ 
      hasCrmAccess,
      crmCourses: coursesWithCrmAccess.map(course => ({
        id: course._id,
        title: course.title
      }))
    });

  } catch (error) {
    console.error('Error checking CRM access:', error);
    return Response.json({ 
      message: 'Error checking CRM access',
      error: error.message 
    }, { status: 500 });
  }
}
