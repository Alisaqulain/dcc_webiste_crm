import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import User from '@/models/User';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/video/access
 * 
 * Generates secure video access tokens/URLs for authenticated users
 * Supports multiple video providers:
 * - Cloudflare Stream
 * - Vimeo Pro
 * - AWS S3 + CloudFront
 */
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const videoId = searchParams.get('videoId');
    const provider = searchParams.get('provider');

    if (!courseId || !videoId || !provider) {
      return Response.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find course and video
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return Response.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const video = course.videos?.find(v => v._id?.toString() === videoId);
    if (!video) {
      return Response.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if video is a free preview
    if (video.isFreePreview || video.isPreview) {
      // Generate access for preview videos
      return generateVideoAccess(provider, video, session.user);
    }

    // Check if user has purchased the course
    const user = await User.findById(session.user.id).lean();
    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has purchased this course
    const hasPurchased = user.purchasedCourses?.some(
      pc => pc.courseId?.toString() === courseId
    );

    if (!hasPurchased) {
      return Response.json(
        { error: 'Access denied. Please purchase this course.' },
        { status: 403 }
      );
    }

    // Generate secure video access
    return generateVideoAccess(provider, video, session.user);
  } catch (error) {
    console.error('Error generating video access:', error);
    return Response.json(
      { error: 'Failed to generate video access' },
      { status: 500 }
    );
  }
}

/**
 * Generate video access based on provider
 */
async function generateVideoAccess(provider, video, user) {
  switch (provider) {
    case 'cloudflare':
      return generateCloudflareStreamToken(video, user);
    
    case 'vimeo-pro':
      return generateVimeoProToken(video, user);
    
    case 'aws-s3':
      return generateAwsSignedUrl(video, user);
    
    case 'direct':
      return generateDirectUrl(video, user);
    
    default:
      return Response.json(
        { error: 'Unsupported video provider' },
        { status: 400 }
      );
  }
}

/**
 * Cloudflare Stream Token Generation
 * Requires: CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN
 */
async function generateCloudflareStreamToken(video, user) {
  const streamId = video.cloudflareStreamId;
  
  if (!streamId) {
    return Response.json(
      { error: 'Cloudflare Stream ID not configured' },
      { status: 400 }
    );
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return Response.json(
      { error: 'Cloudflare Stream not configured' },
      { status: 500 }
    );
  }

  try {
    // Generate signed URL token (valid for 1 hour)
    const expiresIn = 3600; // 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;

    // Create signed URL using Cloudflare Stream
    // Note: This is a simplified version. For production, use Cloudflare's signing library
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}/token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessRules: [
            {
              type: 'ip.geoip.country',
              action: 'allow',
              country: ['*'], // Allow all countries, or restrict as needed
            },
          ],
          expiresAt: expiresAt,
          downloadable: false, // Prevent downloads
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to generate token');
    }

    const data = await response.json();
    
    // Return token and player URL
    return Response.json({
      token: data.result?.token,
      url: `https://customer-${accountId}.cloudflarestream.com/${streamId}/manifest/video.m3u8?token=${data.result?.token}`,
      provider: 'cloudflare',
      expiresAt: expiresAt,
    });
  } catch (error) {
    console.error('Cloudflare Stream error:', error);
    return Response.json(
      { error: 'Failed to generate Cloudflare Stream token' },
      { status: 500 }
    );
  }
}

/**
 * Vimeo Pro Token Generation
 * Requires: VIMEO_ACCESS_TOKEN
 */
async function generateVimeoProToken(video, user) {
  const vimeoVideoId = video.vimeoProVideoId;
  
  if (!vimeoVideoId) {
    return Response.json(
      { error: 'Vimeo Pro video ID not configured' },
      { status: 400 }
    );
  }

  const accessToken = process.env.VIMEO_ACCESS_TOKEN;

  if (!accessToken) {
    return Response.json(
      { error: 'Vimeo Pro not configured' },
      { status: 500 }
    );
  }

  try {
    // Get Vimeo video with signed embed
    const response = await fetch(
      `https://api.vimeo.com/videos/${vimeoVideoId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Vimeo video');
    }

    const data = await response.json();
    
    // Generate signed embed URL (Vimeo Pro feature)
    // Note: Vimeo Pro allows domain-level restrictions and signed embeds
    const embedUrl = data.embed?.html?.match(/src="([^"]+)"/)?.[1];
    
    if (!embedUrl) {
      return Response.json(
        { error: 'Failed to get Vimeo embed URL' },
        { status: 500 }
      );
    }

    // Add privacy and security parameters
    const secureUrl = new URL(embedUrl);
    secureUrl.searchParams.set('autoplay', '0');
    secureUrl.searchParams.set('controls', '1');
    secureUrl.searchParams.set('title', '0');
    secureUrl.searchParams.set('byline', '0');
    secureUrl.searchParams.set('portrait', '0');
    secureUrl.searchParams.set('transparent', '0');

    return Response.json({
      url: secureUrl.toString(),
      provider: 'vimeo-pro',
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });
  } catch (error) {
    console.error('Vimeo Pro error:', error);
    return Response.json(
      { error: 'Failed to generate Vimeo Pro access' },
      { status: 500 }
    );
  }
}

/**
 * AWS S3 + CloudFront Signed URL Generation
 * Requires: CLOUDFRONT_DOMAIN, CLOUDFRONT_KEY_PAIR_ID, CLOUDFRONT_PRIVATE_KEY
 */
async function generateAwsSignedUrl(video, user) {
  const videoKey = video.awsVideoKey;
  
  if (!videoKey) {
    return Response.json(
      { error: 'AWS video key not configured' },
      { status: 400 }
    );
  }

  const cloudfrontDomain = process.env.CLOUDFRONT_DOMAIN;
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
  const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

  if (!cloudfrontDomain || !keyPairId || !privateKey) {
    return Response.json(
      { error: 'CloudFront not configured' },
      { status: 500 }
    );
  }

  try {
    // Use CloudFront signer to generate signed URL
    const cloudfrontSigner = await import('@/lib/cloudfrontSigner');
    const { generateSignedUrlFromKey, loadPrivateKey } = cloudfrontSigner;
    
    const privateKeyContent = loadPrivateKey(privateKey);
    const expiresIn = 3600; // 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    
    const signedUrl = generateSignedUrlFromKey(
      videoKey,
      cloudfrontDomain,
      keyPairId,
      privateKeyContent,
      expiresIn
    );
    
    return Response.json({
      url: signedUrl,
      provider: 'aws-s3',
      expiresAt: expiresAt,
    });
  } catch (error) {
    console.error('AWS S3/CloudFront error:', error);
    return Response.json(
      { error: 'Failed to generate signed URL: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * Direct URL (for self-hosted videos with token)
 */
async function generateDirectUrl(video, user) {
  const secureUrl = video.secureVideoUrl;
  
  if (!secureUrl) {
    return Response.json(
      { error: 'Secure video URL not configured' },
      { status: 400 }
    );
  }

  // Generate time-limited token
  const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour
  const token = generateSecureToken(user.id, expiresAt);

  // Append token to URL
  const url = new URL(secureUrl);
  url.searchParams.set('token', token);
  url.searchParams.set('expires', expiresAt.toString());

  return Response.json({
    url: url.toString(),
    token: token,
    provider: 'direct',
    expiresAt: expiresAt,
  });
}

/**
 * Generate secure token for direct video access
 */
function generateSecureToken(userId, expiresAt) {
  // In production, use proper JWT or crypto signing
  const crypto = require('crypto');
  const secret = process.env.NEXTAUTH_SECRET || 'your-secret-key';
  const payload = `${userId}:${expiresAt}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

