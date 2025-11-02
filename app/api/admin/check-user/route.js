import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Course from '@/models/Course';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  try {
    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
  } catch (e) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();

    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return Response.json({ message: 'Email parameter required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('courses.courseId', 'title thumbnail videos')
      .lean();

    if (!user) {
      return Response.json({ 
        message: 'User not found',
        email: email 
      });
    }

    const courses = user.courses || [];
    const courseDetails = await Promise.all(
      courses.map(async (c) => {
        if (c.courseId) {
          const course = await Course.findById(c.courseId).select('title thumbnail videos').lean();
          return {
            courseId: c.courseId,
            courseTitle: course?.title || 'Unknown',
            videoCount: course?.videos?.length || 0,
            purchasedAt: c.purchasedAt,
            status: c.status,
            progress: c.progress
          };
        }
        return null;
      })
    );

    return Response.json({
      ok: true,
      user: {
        email: user.email,
        name: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim(),
        totalCourses: courses.length
      },
      courses: courseDetails.filter(c => c !== null)
    });
  } catch (error) {
    console.error('Admin check user error:', error);
    return Response.json({ message: 'Failed to check user', error: error.message }, { status: 500 });
  }
}
