import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

// Verify admin token
function verifyAdminToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  
  const token = authHeader.substring(7);
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

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
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const blogs = await Blog.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content') // Exclude content for list view
      .lean();

    const total = await Blog.countDocuments(query);

    return Response.json({
      blogs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
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
      excerpt,
      content,
      featuredImage,
      author,
      category,
      tags = [],
      status = 'draft',
      isFeatured = false,
      seo = {}
    } = await request.json();

    // Validate required fields
    if (!title || !excerpt || !content || !featuredImage || !author?.name || !author?.email || !category) {
      return Response.json({ 
        message: 'Missing required fields: title, excerpt, content, featuredImage, author name, author email, and category are required' 
      }, { status: 400 });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return Response.json({ 
        message: 'A blog post with this title already exists' 
      }, { status: 400 });
    }

    // Create blog post
    const blog = new Blog({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      author,
      category,
      tags,
      status,
      isFeatured,
      seo
    });

    await blog.save();

    return Response.json({
      message: 'Blog post created successfully',
      blog: blog
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    if (error.name === 'ValidationError') {
      return Response.json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      }, { status: 400 });
    }
    return Response.json({ 
      message: 'Error creating blog post',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
