import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
};

export async function PUT(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const combo = await ComboCourse.findByIdAndUpdate(
      id,
      {
        title: body.title,
        description: body.description,
        shortDescription: body.shortDescription,
        price: body.price,
        originalPrice: body.originalPrice,
        thumbnail: body.thumbnail,
        banner: body.banner,
        viewMore: body.viewMore,
        shortDescription: body.shortDescription,
        courseIds: body.courseIds,
        hasCrmAccess: Boolean(body.hasCrmAccess),
        isPublished: Boolean(body.isPublished),
      },
      { new: true, runValidators: true }
    ).populate('courseIds', 'title price');
    if (!combo) return Response.json({ message: 'Not found' }, { status: 404 });
    return Response.json({ combo });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    await ComboCourse.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
