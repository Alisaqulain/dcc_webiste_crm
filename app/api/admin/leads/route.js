import connectDB from '@/lib/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!verifyAdminToken(token)) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const leads = await Lead.find()
      .populate('user', 'email profile')
      .sort({ createdAt: -1 })
      .lean();

    return Response.json({ leads });
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

    const updateData = { status };
    if (status === 'approved' && !updateData.approvedAt) {
      updateData.approvedAt = new Date();
    }
    if (status === 'paid' && !updateData.paidAt) {
      updateData.paidAt = new Date();
    }

    const updated = await Lead.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('user', 'email profile').lean();

    if (!updated) {
      return Response.json({ message: 'Lead not found' }, { status: 404 });
    }

    return Response.json({ ok: true, lead: updated });
  } catch (error) {
    console.error('Admin PUT leads error', error);
    return Response.json({ message: 'Failed to update lead' }, { status: 500 });
  }
}

