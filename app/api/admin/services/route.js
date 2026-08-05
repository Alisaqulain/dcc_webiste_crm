import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { slugify } from '@/lib/slugify';
import jwt from 'jsonwebtoken';

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

async function uniqueSlug(base, excludeId = null) {
  let slug = slugify(base);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const q = { slug: candidate };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await Service.findOne(q).select('_id').lean();
    if (!exists) return candidate;
    n += 1;
  }
}

export async function GET(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const services = await Service.find().sort({ order: 1, title: 1 }).lean();
    return Response.json({ services, total: services.length });
  } catch (error) {
    return Response.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();

    if (!body.title?.trim()) {
      return Response.json({ message: 'Title is required' }, { status: 400 });
    }

    const slug = body.slug?.trim()
      ? slugify(body.slug)
      : await uniqueSlug(body.title);

    const service = await Service.create({
      title: body.title.trim(),
      slug,
      shortDescription: body.shortDescription?.trim() || '',
      heroTitle: body.heroTitle?.trim() || body.title.trim(),
      heroSubtitle: body.heroSubtitle?.trim() || '',
      image: body.image?.trim() || '',
      phone: body.phone?.trim() || '',
      sections: body.sections || [],
      features: body.features || [],
      isPublished: body.isPublished !== false,
      showInHeader: body.showInHeader !== false,
      order: Number(body.order) || 0,
    });

    return Response.json({ success: true, service }, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return Response.json({ message: 'A service with this slug already exists' }, { status: 400 });
    }
    return Response.json({ message: error.message || 'Failed to create service' }, { status: 500 });
  }
}
