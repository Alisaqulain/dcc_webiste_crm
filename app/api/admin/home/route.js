import connectDB from '@/lib/mongodb';
import Homepage from '@/models/Homepage';

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Note: Body size limits are controlled by the web server (Nginx/Apache)
// For KVM hosting, ensure Nginx has: client_max_body_size 50M;

// Inline token verification to match existing admin APIs style
const verifyAdminToken = (request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'your-secret-key');
    return decoded;
  } catch (e) {
    throw new Error('Invalid token');
  }
};

export async function GET(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    await connectDB();
    const doc = await Homepage.findOne({ slug: 'default' }).lean();
    return Response.json({ ok: true, content: doc || null });
  } catch (error) {
    console.error('Admin GET /api/admin/home error', error);
    return Response.json({ ok: false, message: 'Failed to load homepage content' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    try { verifyAdminToken(request); } catch (authError) {
      return Response.json({ message: authError.message }, { status: 401 });
    }

    // Check content length before parsing
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeMB = 4; // Conservative 4MB limit (typical server default is 1-5MB)
      if (sizeInMB > maxSizeMB) {
        return Response.json(
          { 
            ok: false, 
            message: `Request body is too large (${sizeInMB.toFixed(2)}MB). Maximum size is ${maxSizeMB}MB. Please remove large base64-encoded images and use file uploads instead.` 
          },
          { status: 413 }
        );
      }
    }

    await connectDB();
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      // Handle JSON parsing errors (including 413 from server)
      if (parseError.message.includes('413') || parseError.message.includes('Payload Too Large')) {
        return Response.json(
          { 
            ok: false, 
            message: 'Request body is too large. Please reduce the size of your content, especially image data.' 
          },
          { status: 413 }
        );
      }
      throw parseError;
    }

    // Clean large base64 data URLs from the body (safety measure)
    const cleanBase64Images = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) {
        return obj.map(item => cleanBase64Images(item));
      }
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('data:image') && value.length > 100000) {
          // Remove large base64 images (keep small ones like thumbnails)
          console.warn(`Removing large base64 image from ${key} (${(value.length / 1024).toFixed(2)}KB)`);
          cleaned[key] = '';
        } else if (typeof value === 'object' && value !== null) {
          cleaned[key] = cleanBase64Images(value);
        } else {
          cleaned[key] = value;
        }
      }
      return cleaned;
    };

    const cleanedBody = cleanBase64Images(body);

    const update = {
      seo: cleanedBody.seo || {},
      heroSlides: cleanedBody.heroSlides || [],
      packages: cleanedBody.packages || [],
      instructors: cleanedBody.instructors || [],
      testimonials: cleanedBody.testimonials || [],
      texts: cleanedBody.texts || []
    };

    console.log('Saving homepage content:', {
      packagesCount: update.packages.length,
      slidesCount: update.heroSlides.length,
      testimonialsCount: update.testimonials.length
    });

    const doc = await Homepage.findOneAndUpdate(
      { slug: 'default' },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    console.log('Saved homepage content:', {
      packagesCount: doc?.packages?.length || 0,
      slidesCount: doc?.heroSlides?.length || 0,
      testimonialsCount: doc?.testimonials?.length || 0
    });

    // Return with no-cache headers to ensure fresh data
    return Response.json(
      { ok: true, content: doc },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Admin PUT /api/admin/home error', error);
    return Response.json({ ok: false, message: 'Failed to save homepage content' }, { status: 500 });
  }
}


