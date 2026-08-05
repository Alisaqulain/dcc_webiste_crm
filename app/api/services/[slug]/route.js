import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { slugify } from '@/lib/slugify';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { slug } = await params;
    const service = await Service.findOne({ slug: slugify(slug), isPublished: true }).lean();
    if (!service) {
      return Response.json({ message: 'Service not found' }, { status: 404 });
    }
    return Response.json({ service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return Response.json({ message: 'Error fetching service' }, { status: 500 });
  }
}
