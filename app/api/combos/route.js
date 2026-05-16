import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';
import '@/models/Course';
import { enrichCombo } from '@/lib/enrichCombo';

export async function GET() {
  try {
    await connectDB();
    const raw = await ComboCourse.find({ isPublished: true })
      .populate(
        'courseIds',
        'title price originalPrice thumbnail category level shortDescription description perks features instructor banner viewMore isPublished'
      )
      .sort({ createdAt: -1 })
      .lean();

    const combos = raw
      .map((doc) => {
        const validCourses = (doc.courseIds || []).filter((c) => c && c._id);
        return enrichCombo({ ...doc, courseIds: validCourses });
      })
      .filter((c) => c && c.courseCount >= 2);

    return Response.json({ combos });
  } catch (e) {
    console.error('GET /api/combos error:', e);
    return Response.json({ message: e.message, combos: [] }, { status: 500 });
  }
}
