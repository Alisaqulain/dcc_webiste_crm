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

export async function GET(request) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const isPublished = searchParams.get('isPublished') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by level
    if (level) {
      query.level = level;
    }
    
    // Filter by published status
    if (isPublished !== '') {
      query.isPublished = isPublished === 'true';
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const courses = await Course.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Course.countDocuments(query);

    return Response.json({
      courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalCourses: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ message: error.message }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    
    // Verify admin authentication
    const admin = verifyAdminToken(request);
    
    const {
      title,
      description,
      shortDescription,
      price,
      originalPrice,
      currency = 'INR',
      category,
      level,
      duration,
      language = 'English',
      instructor,
      thumbnail,
      features = [],
      requirements = [],
      whatYouWillLearn = [],
      tags = [],
      isPublished = false,
      isFeatured = false,
      hasCrmAccess = false,
      discount = {}
    } = await request.json();

    // Validate required fields
    if (!title || !description || !price || !category || !level || !instructor?.name || !thumbnail) {
      return Response.json({ 
        message: 'Missing required fields: title, description, price, category, level, instructor name, and thumbnail are required' 
      }, { status: 400 });
    }

    // Create course
    const course = new Course({
      title,
      description,
      shortDescription,
      price,
      originalPrice,
      currency,
      category,
      level,
      duration,
      language,
      instructor,
      thumbnail,
      features,
      requirements,
      whatYouWillLearn,
      tags,
      isPublished,
      isFeatured,
      hasCrmAccess,
      discount
    });

    await course.save();

    return Response.json({
      message: 'Course created successfully',
      course: course
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    if (error.name === 'ValidationError') {
      return Response.json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      }, { status: 400 });
    }
    return Response.json({ message: 'Error creating course' }, { status: 500 });
  }
}
