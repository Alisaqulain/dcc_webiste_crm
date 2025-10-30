import connectDB from '@/lib/mongodb';
import Homepage from '@/models/Homepage';

// Inline token verification to match existing admin APIs style
const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (e) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();
    const doc = await Homepage.findOne({ slug: 'default' }).lean();
    return Response.json({ ok: true, content: doc || null });
  } catch (error) {
    console.error('Admin GET /api/admin/home error', error);
    return Response.json({ ok: false, message: 'Failed to load homepage content' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    const update = {
      seo: body.seo || {},
      heroSlides: body.heroSlides || [],
      packages: body.packages || [],
      instructors: body.instructors || [],
      testimonials: body.testimonials || [],
      texts: body.texts || []
    };

    const doc = await Homepage.findOneAndUpdate(
      { slug: 'default' },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    return Response.json({ ok: true, content: doc });
  } catch (error) {
    console.error('Admin PUT /api/admin/home error', error);
    return Response.json({ ok: false, message: 'Failed to save homepage content' }, { status: 500 });
  }
}


