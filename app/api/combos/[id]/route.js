import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';
import '@/models/Course';
import { enrichCombo } from '@/lib/enrichCombo';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const raw = await ComboCourse.findOne({
      _id: id,
      isPublished: true,
    })
      .populate(
        'courseIds',
        'title price originalPrice thumbnail shortDescription description category level duration perks features instructor banner viewMore'
      )
      .lean();
    if (!raw) {
      return Response.json({ message: 'Combo not found' }, { status: 404 });
    }
    return Response.json({ combo: enrichCombo(raw) });
  } catch (e) {
    return Response.json({ message: e.message }, { status: 500 });
  }
}
