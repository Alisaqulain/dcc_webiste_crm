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
        'title price originalPrice thumbnail category level shortDescription description perks features instructor banner viewMore'
      )
      .sort({ createdAt: -1 })
      .lean();
    const combos = raw.map((c) => enrichCombo(c));
    return Response.json({ combos });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
