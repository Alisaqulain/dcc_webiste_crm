import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';
import '@/models/Course';
import { mapPublicCombos, COMBO_CACHE_HEADERS } from '@/lib/comboApi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const raw = await ComboCourse.findOne({
      _id: id,
      isPublished: true,
    })
      .populate({
        path: 'courseIds',
        select:
          'title price originalPrice thumbnail shortDescription description category level duration perks features instructor banner viewMore',
        options: { strictPopulate: false },
      })
      .lean();

    if (!raw) {
      return Response.json(
        { message: 'Combo not found' },
        { status: 404, headers: COMBO_CACHE_HEADERS }
      );
    }

    const [combo] = mapPublicCombos([raw], request);
    if (!combo) {
      return Response.json(
        { message: 'Combo not available' },
        { status: 404, headers: COMBO_CACHE_HEADERS }
      );
    }

    return Response.json({ combo }, { headers: COMBO_CACHE_HEADERS });
  } catch (e) {
    return Response.json(
      { message: e.message },
      { status: 500, headers: COMBO_CACHE_HEADERS }
    );
  }
}
