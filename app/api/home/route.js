import connectDB from '@/lib/mongodb';
import Homepage from '@/models/Homepage';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const doc = await Homepage.findOne({ slug: 'default' }).lean();

    console.log('GET /api/home - Packages count:', doc?.packages?.length || 0);

    return Response.json(
      {
        ok: true,
        content: doc || null
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('GET /api/home error', error);
    return Response.json({ ok: false, message: 'Failed to load homepage content' }, { status: 500 });
  }
}


