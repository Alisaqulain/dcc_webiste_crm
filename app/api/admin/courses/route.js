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
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const isPublished = searchParams.get('isPublished') || '';
    // Sort by newest first by default so new courses appear at top
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // Newest first

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

    const total = await Course.countDocuments(query);

    // If limit is 0 or undefined, fetch all courses (no pagination)
    let courses;
    if (limit === 0) {
      courses = await Course.find(query)
        .sort(sortOptions)
        .lean();
    } else {
      courses = await Course.find(query)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();
    }

    return Response.json({
      courses,
      pagination: {
        currentPage: limit === 0 ? 1 : parseInt(page),
        totalPages: limit === 0 ? 1 : Math.ceil(total / limit),
        totalCourses: total,
        hasNext: limit === 0 ? false : page < Math.ceil(total / limit),
        hasPrev: limit === 0 ? false : page > 1
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ 
      message: error.message || 'Failed to fetch courses',
      error: error.stack 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verify admin authentication
    try {
      verifyAdminToken(request);
    } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }
    
    await connectDB();
    
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
