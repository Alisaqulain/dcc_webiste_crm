import connectDB from '@/lib/mongodb';
import OfflineStudent from '@/models/OfflineStudent';
import { computeFeeStatus, enrichOfflineStudent } from '@/lib/offlineStudentFees';

const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
};

/** POST — create or update fee for a given year + month (one row per month). */
export async function POST(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const body = await request.json();
    const student = await OfflineStudent.findById(params.id);
    if (!student) return Response.json({ message: 'Not found' }, { status: 404 });

    const year = Number(body.year) || new Date().getFullYear();
    const month = Number(body.month) || new Date().getMonth() + 1;
    if (month < 1 || month > 12) {
      return Response.json({ message: 'Invalid month' }, { status: 400 });
    }

    const amountDue = Number(body.amountDue ?? student.monthlyFeeAmount) || 0;
    const amountPaid = Number(body.amountPaid) || 0;
    const status = computeFeeStatus(amountDue, amountPaid);

    const payload = {
      year,
      month,
      amountDue,
      amountPaid,
      paidAt: amountPaid > 0 ? body.paidAt || new Date() : undefined,
      paymentMode: body.paymentMode || 'cash',
      status,
      notes: body.notes || '',
    };

    const idx = student.feeRecords.findIndex(
      (r) => Number(r.year) === year && Number(r.month) === month
    );

    if (idx >= 0) {
      student.feeRecords[idx].amountDue = payload.amountDue;
      student.feeRecords[idx].amountPaid = payload.amountPaid;
      student.feeRecords[idx].paidAt = payload.paidAt;
      student.feeRecords[idx].paymentMode = payload.paymentMode;
      student.feeRecords[idx].status = payload.status;
      student.feeRecords[idx].notes = payload.notes;
    } else {
      student.feeRecords.push(payload);
    }

    await student.save();

    const fresh = await OfflineStudent.findById(params.id)
      .populate('centerId', 'name city phone')
      .lean();

    return Response.json({ student: enrichOfflineStudent(fresh) });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}

/** DELETE — remove one fee record by subdocument _id */
export async function DELETE(request, { params }) {
  try {
    verifyAdminToken(request);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    if (!recordId) {
      return Response.json({ message: 'recordId required' }, { status: 400 });
    }

    const student = await OfflineStudent.findById(params.id);
    if (!student) return Response.json({ message: 'Not found' }, { status: 404 });

    student.feeRecords = student.feeRecords.filter(
      (r) => String(r._id) !== String(recordId)
    );
    await student.save();

    const fresh = await OfflineStudent.findById(params.id)
      .populate('centerId', 'name city phone')
      .lean();

    return Response.json({ student: enrichOfflineStudent(fresh) });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 400 });
  }
}
