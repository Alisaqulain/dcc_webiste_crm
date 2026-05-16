import connectDB from '@/lib/mongodb';
import ComboCourse from '@/models/ComboCourse';
import '@/models/Course';
import { mapPublicCombos, COMBO_CACHE_HEADERS } from '@/lib/comboApi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    await connectDB();
    const raw = await ComboCourse.find({ isPublished: true })
      .populate({
        path: 'courseIds',
        select:
          'title price originalPrice thumbnail category level shortDescription description perks features instructor banner viewMore isPublished',
        options: { strictPopulate: false },
      })
      .sort({ createdAt: -1 })
      .lean();

    const combos = mapPublicCombos(raw, request);

    return Response.json(
      { combos, count: combos.length },
      { headers: COMBO_CACHE_HEADERS }
    );
  } catch (e) {
    console.error('GET /api/combos error:', e);
    return Response.json(
      { message: e.message, combos: [] },
      { status: 500, headers: COMBO_CACHE_HEADERS }
    );
  }
}
