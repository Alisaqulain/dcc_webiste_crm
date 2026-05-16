import connectDB from '@/lib/mongodb';
import OfflineCenter from '@/models/OfflineCenter';
import OfflineStudent from '@/models/OfflineStudent';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
};

export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { id } = await params;
    const cascade = new URL(request.url).searchParams.get('cascade') === 'true';

    const studentCount = await OfflineStudent.countDocuments({ centerId: id });
    if (studentCount > 0 && !cascade) {
      return Response.json(
        {
          message: `This center has ${studentCount} student(s). Open the Centers tab and use "Delete center completely", or delete students first.`,
          studentCount,
        },
        { status: 400 }
      );
    }

    if (cascade && studentCount > 0) {
      await OfflineStudent.deleteMany({ centerId: id });
    }

    const center = await OfflineCenter.findByIdAndDelete(id);
    if (!center) {
      return Response.json({ message: 'Center not found' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ message: e.message }, { status: e.message === 'No token provided' ? 401 : 400 });
  }
}
