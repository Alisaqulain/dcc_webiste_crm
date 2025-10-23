import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { courseId } = await params;
    const course = await Course.findById(courseId)
      .select('-videos') // Exclude videos for performance
      .lean();

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
