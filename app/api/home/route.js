import connectDB from '@/lib/mongodb';
import Homepage from '@/models/Homepage';

export async function GET() {
  try {
    await connectDB();

    const doc = await Homepage.findOne({ slug: 'default' }).lean();

    return Response.json({
      ok: true,
      content: doc || null
    });
  } catch (error) {
    console.error('GET /api/home error', error);
    return Response.json({ ok: false, message: 'Failed to load homepage content' }, { status: 500 });
  }
}


