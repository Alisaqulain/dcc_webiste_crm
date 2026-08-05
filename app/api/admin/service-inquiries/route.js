import connectDB from '@/lib/mongodb';
import ServiceInquiry from '@/models/ServiceInquiry';
import jwt from 'jsonwebtoken';

const PAGE_SIZE = 50;

function verifyAdminToken(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
}

async function getStats(filter = {}) {
  const base = { ...filter };
  const [total, newCount, contacted, closed] = await Promise.all([
    ServiceInquiry.countDocuments(base),
    ServiceInquiry.countDocuments({ ...base, status: 'new' }),
    ServiceInquiry.countDocuments({ ...base, status: 'contacted' }),
    ServiceInquiry.countDocuments({ ...base, status: 'closed' }),
  ]);
  return { total, new: newCount, contacted, closed };
}

export async function GET(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('serviceId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || PAGE_SIZE));

    const query = {};
    if (serviceId) query.serviceId = serviceId;
    if (status) query.status = status;

    const total = await ServiceInquiry.countDocuments(query);
    const totalPages = Math.ceil(total / limit) || 1;

    const inquiries = await ServiceInquiry.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const stats = await getStats(serviceId ? { serviceId } : {});

    return Response.json({
      inquiries,
      stats,
      pagination: {
        page,
        currentPage: page,
        totalPages,
        total,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return Response.json({ message: error.message || 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return Response.json({ message: 'id and status are required' }, { status: 400 });
    }

    const inquiry = await ServiceInquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean();

    if (!inquiry) return Response.json({ message: 'Inquiry not found' }, { status: 404 });
    return Response.json({ success: true, inquiry });
  } catch (error) {
    return Response.json({ message: error.message || 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ message: 'id is required' }, { status: 400 });
    }

    const deleted = await ServiceInquiry.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ message: 'Inquiry not found' }, { status: 404 });
    }

    return Response.json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    return Response.json({ message: error.message || 'Failed to delete' }, { status: 500 });
  }
}
