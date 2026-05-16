import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';
import '@/models/Course';
import { COMBO_CACHE_HEADERS } from '@/lib/comboApi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
};

export async function GET(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const combos = await ComboCourse.find()
      .populate('courseIds', 'title price thumbnail')
      .sort({ createdAt: -1 })
      .lean();
    return Response.json({ combos }, { headers: COMBO_CACHE_HEADERS });
  } catch (e) {
    return Response.json(
      { message: e.message },
      { status: e.message.includes('token') ? 401 : 500, headers: COMBO_CACHE_HEADERS }
    );
  }
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const combo = await ComboCourse.create({
      title: body.title,
      description: body.description,
      shortDescription: body.shortDescription,
      price: body.price,
      originalPrice: body.originalPrice,
      thumbnail: body.thumbnail,
      banner: body.banner,
      viewMore: body.viewMore,
      courseIds: body.courseIds || [],
      hasCrmAccess: Boolean(body.hasCrmAccess),
      isPublished: body.isPublished !== false,
    });
    return Response.json(
      { combo, ok: true },
      { status: 201, headers: COMBO_CACHE_HEADERS }
    );
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
