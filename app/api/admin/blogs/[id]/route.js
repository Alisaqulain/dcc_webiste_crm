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
    const blog = await Blog.findById(id);

    if (!blog) {
      return Response.json({ message: 'Blog post not found' }, { status: 404 });
    }

    return Response.json({ blog });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return Response.json({ message: 'Error fetching blog post' }, { status: 500 });
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

    // If title is being updated, generate new slug
    if (updateData.title) {
      const slug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      
      // Check if new slug already exists (excluding current blog)
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: id } });
      if (existingBlog) {
        return Response.json({ 
          message: 'A blog post with this title already exists' 
        }, { status: 400 });
      }
      
      updateData.slug = slug;
    }

    // Set publishedAt when status changes to published
    if (updateData.status === 'published') {
      const currentBlog = await Blog.findById(id);
      if (currentBlog && currentBlog.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return Response.json({ message: 'Blog post not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Blog post updated successfully',
      blog: blog
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    if (error.name === 'ValidationError') {
      return Response.json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(err => err.message) 
      }, { status: 400 });
    }
    return Response.json({ message: 'Error updating blog post' }, { status: 500 });
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
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return Response.json({ message: 'Blog post not found' }, { status: 404 });
    }

    return Response.json({
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return Response.json({ message: 'Error deleting blog post' }, { status: 500 });
  }
}
