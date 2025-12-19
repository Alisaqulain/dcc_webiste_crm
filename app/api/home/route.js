import connectDB from '@/lib/mongodb';
import Homepage from '@/models/Homepage';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const doc = await Homepage.findOne({ slug: 'default' }).lean();

    // If no document exists, return empty structure instead of null
    const content = doc || {
      slug: 'default',
      seo: { title: '', description: '', image: '', url: '' },
      heroSlides: [],
      packages: [],
      instructors: [],
      testimonials: [],
      texts: []
    };

    // Log image URLs to verify they're being loaded
    const packageImages = content?.packages?.map((pkg, i) => ({
      index: i,
      title: pkg.title,
      image: pkg.image || 'NO IMAGE'
    })) || [];
    const slideImages = content?.heroSlides?.map((slide, i) => ({
      index: i,
      id: slide.id,
      image: slide.image || 'NO IMAGE'
    })) || [];
    const testimonialImages = content?.testimonials?.map((test, i) => ({
      index: i,
      author: test.author,
      image: test.image || 'NO IMAGE'
    })) || [];

    console.log('GET /api/home - Content loaded:', {
      hasDocument: !!doc,
      packagesCount: content?.packages?.length || 0,
      slidesCount: content?.heroSlides?.length || 0,
      testimonialsCount: content?.testimonials?.length || 0,
      packageImages: packageImages,
      slideImages: slideImages,
      testimonialImages: testimonialImages
    });

    return Response.json(
      {
        ok: true,
        content: content
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
    console.error('GET /api/home error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return empty structure on error instead of failing
    return Response.json(
      {
        ok: true,
        content: {
          slug: 'default',
          seo: { title: '', description: '', image: '', url: '' },
          heroSlides: [],
          packages: [],
          instructors: [],
          testimonials: [],
          texts: []
        },
        error: error.message
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}


