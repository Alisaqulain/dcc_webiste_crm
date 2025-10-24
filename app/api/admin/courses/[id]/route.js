import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

// Verify admin token
const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export async function GET(request, { params }) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { id } = await params;
    const course = await Course.findById(id);
    
    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    return Response.json({ course });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ message: error.message }, { status: 401 });
  }
}

export async function PUT(request, { params }) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { id } = await params;
    const updateData = await request.json();
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.enrollmentCount;
    delete updateData.rating;

    const course = await Course.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Course updated successfully',
      course
    });
  } catch (error) {
    console.error('API Error:', error);
    if (error.name === 'ValidationError') {
      return Response.json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      }, { status: 400 });
    }
    return Response.json({ message: error.message }, { status: 401 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { id } = await params;
    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return Response.json({ message: 'Course not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Course deleted successfully'
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ message: error.message }, { status: 401 });
  }
}
