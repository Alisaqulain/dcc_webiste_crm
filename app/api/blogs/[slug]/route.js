import connectDB from '@/lib/mongodb';
import Blog from '@/models/Blog';

export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { slug } = await params;
    const blog = await Blog.findOne({ slug, status: 'published' });

    if (!blog) {
      return Response.json({ message: 'Blog post not found' }, { status: 404 });
    }

    // Increment view count
    await Blog.findByIdAndUpdate(blog._id, { $inc: { viewCount: 1 } });

    return Response.json({ blog });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return Response.json({ message: 'Error fetching blog post' }, { status: 500 });
  }
}
