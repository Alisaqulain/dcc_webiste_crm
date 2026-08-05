import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const headerOnly = searchParams.get('header') === 'true';

    const query = { isPublished: true };
    if (headerOnly) query.showInHeader = true;

    const services = await Service.find(query)
      .select('title slug shortDescription image phone order')
      .sort({ order: 1, title: 1 })
      .lean();

    return Response.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return Response.json({ message: 'Error fetching services' }, { status: 500 });
  }
}
