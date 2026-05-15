import connectDB from '@/lib/mongodb';
import OfflineCenter from '@/models/OfflineCenter';

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
    const centers = await OfflineCenter.find().sort({ name: 1 }).lean();
    return Response.json({ centers });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const center = await OfflineCenter.create(body);
    return Response.json({ center }, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
