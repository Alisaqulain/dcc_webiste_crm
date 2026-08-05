import connectDB from '@/lib/mongodb';
import OfflineStudent from '@/models/OfflineStudent';
import '@/models/OfflineCenter';
import { enrichOfflineStudent } from '@/lib/offlineStudentFees';

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
    const { searchParams } = new URL(request.url);
    const centerId = searchParams.get('centerId');
    const search = (searchParams.get('search') || '').trim().toLowerCase();

    const q = { isActive: { $ne: false } };
    if (centerId) q.centerId = centerId;

    let students = await OfflineStudent.find(q)
      .populate('centerId', 'name city phone')
      .sort({ fullName: 1 })
      .lean();

    if (search) {
      students = students.filter((s) => {
        const hay = [
          s.fullName,
          s.rollNo,
          s.phone,
          s.email,
          s.courseLabel,
          s.guardianName,
          s.centerId?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(search);
      });
    }

    const enriched = students.map(enrichOfflineStudent);

    const stats = {
      totalStudents: enriched.length,
      paidThisMonth: enriched.filter((s) => s.feeSummary.currentStatus === 'paid').length,
      partialThisMonth: enriched.filter((s) => s.feeSummary.currentStatus === 'partial').length,
      unpaidThisMonth: enriched.filter((s) => s.feeSummary.currentStatus === 'unpaid').length,
      totalCollected: enriched.reduce((sum, s) => sum + s.feeSummary.totalPaid, 0),
    };

    return Response.json({ students: enriched, stats });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 401 });
  }
}

export async function POST(request) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const student = await OfflineStudent.create({
      centerId: body.centerId,
      fullName: body.fullName,
      rollNo: body.rollNo?.trim() || '',
      phone: body.phone,
      email: body.email,
      guardianName: body.guardianName,
      address: body.address,
      admissionDate: body.admissionDate || new Date(),
      courseLabel: body.courseLabel,
      monthlyFeeAmount: body.monthlyFeeAmount || 0,
      notes: body.notes,
    });
    const populated = await OfflineStudent.findById(student._id)
      .populate('centerId', 'name city')
      .lean();
    return Response.json({ student: enrichOfflineStudent(populated) }, { status: 201 });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
