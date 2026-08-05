import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';

function listingTypeQuery() {
  return { listingType: 'app' };
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const level = searchParams.get('level') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 12;

    const query = { isPublished: true, ...listingTypeQuery() };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (category) query.category = category;
    if (level) query.level = level;

    let sortOptions = { createdAt: -1 };
    switch (sortBy) {
      case 'price-low':
        sortOptions = { price: 1 };
        break;
      case 'price-high':
        sortOptions = { price: -1 };
        break;
      case 'popular':
        sortOptions = { enrollmentCount: -1 };
        break;
      case 'oldest':
        sortOptions = { createdAt: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const apps = await Course.find(query)
      .sort(sortOptions)
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-videos')
      .lean();

    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    return Response.json({
      apps,
      courses: apps,
      pagination: {
        currentPage: page,
        totalPages,
        totalCourses: total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      total,
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    return Response.json({ message: 'Error fetching apps' }, { status: 500 });
  }
}
