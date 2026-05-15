import connectDB from '@/lib/mongodb';
import OfflineStudent from '@/models/OfflineStudent';
import { enrichOfflineStudent } from '@/lib/offlineStudentFees';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
};

export async function GET(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const student = await OfflineStudent.findById(params.id)
      .populate('centerId', 'name city phone address')
      .lean();
    if (!student) return Response.json({ message: 'Not found' }, { status: 404 });
    return Response.json({ student: enrichOfflineStudent(student) });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 401 });
  }
}

export async function PUT(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const student = await OfflineStudent.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    }).populate('centerId', 'name');
    if (!student) return Response.json({ message: 'Not found' }, { status: 404 });
    return Response.json({ student });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    await OfflineStudent.findByIdAndDelete(params.id);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
