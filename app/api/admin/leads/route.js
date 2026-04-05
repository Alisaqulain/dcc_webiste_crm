import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const skip = (page - 1) * limit;

    const total = await Lead.countDocuments();
    const leads = await Lead.find()
      .populate('user', 'email profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return Response.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Admin GET leads error', error);
    return Response.json({ message: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id, status } = await request.json();

    if (!id || !status) {
      return Response.json({ message: 'ID and status are required' }, { status: 400 });
    }

    const current = await Lead.findById(id);
    if (!current) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    const updateData = { status };
    if (status === 'approved' && !current.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (status === 'paid' && !current.paidAt) {
      updateData.paidAt = new Date();
    }

    const updated = await Lead.findByIdAndUpdate(id, updateData, { new: true })
      .populate('user', 'email profile')
      .lean();

    if (!updated) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ ok: true, lead: updated });
  } catch (error) {
    console.error('Admin PUT leads error', error);
    return Response.json({ message: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return Response.json({ message: 'Lead id is required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Lead.findByIdAndDelete(id).lean();
    if (!deleted) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ ok: true, message: 'Lead deleted' });
  } catch (error) {
    console.error('Admin DELETE leads error', error);
    return Response.json({ message: 'Failed to delete lead' }, { status: 500 });
  }
}
