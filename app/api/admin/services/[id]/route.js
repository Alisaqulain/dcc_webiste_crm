import connectDB from '@/lib/mongodb';
import Service from '@/models/Service';
import { slugify } from '@/lib/slugify';
import jwt from 'jsonwebtoken';

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

async function uniqueSlug(base, excludeId) {
  let slug = slugify(base);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await Service.findOne({ slug: candidate, _id: { $ne: excludeId } })
      .select('_id')
      .lean();
    if (!exists) return candidate;
    n += 1;
  }
}

export async function GET(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id).lean();
    if (!service) return Response.json({ message: 'Service not found' }, { status: 404 });
    return Response.json({ service });
  } catch (error) {
    return Response.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PUT(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const update = { updatedAt: new Date() };
    if (body.title !== undefined) update.title = body.title.trim();
    if (body.shortDescription !== undefined) update.shortDescription = body.shortDescription.trim();
    if (body.heroTitle !== undefined) update.heroTitle = body.heroTitle.trim();
    if (body.heroSubtitle !== undefined) update.heroSubtitle = body.heroSubtitle.trim();
    if (body.image !== undefined) update.image = body.image.trim();
    if (body.phone !== undefined) update.phone = body.phone.trim();
    if (body.sections !== undefined) update.sections = body.sections;
    if (body.features !== undefined) update.features = body.features;
    if (body.isPublished !== undefined) update.isPublished = Boolean(body.isPublished);
    if (body.showInHeader !== undefined) update.showInHeader = Boolean(body.showInHeader);
    if (body.order !== undefined) update.order = Number(body.order) || 0;

    if (body.slug !== undefined && body.slug.trim()) {
      update.slug = slugify(body.slug);
    } else if (body.title !== undefined) {
      update.slug = await uniqueSlug(body.title, id);
    }

    const service = await Service.findByIdAndUpdate(id, update, { new: true });
    if (!service) return Response.json({ message: 'Service not found' }, { status: 404 });
    return Response.json({ success: true, service });
  } catch (error) {
    if (error.code === 11000) {
      return Response.json({ message: 'Slug already in use' }, { status: 400 });
    }
    return Response.json({ message: error.message || 'Failed to update service' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    const service = await Service.findByIdAndDelete(id);
    if (!service) return Response.json({ message: 'Service not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}
