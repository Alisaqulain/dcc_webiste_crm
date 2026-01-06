# Secure Video Setup Guide

This guide explains how to set up secure video streaming for your paid LMS platform.

## Overview

The secure video system supports multiple providers:
1. **Cloudflare Stream** (Recommended - Best DRM and security)
2. **Vimeo Pro** (Good alternative with domain restrictions)
3. **AWS S3 + CloudFront** (Self-hosted with signed URLs)

## Migration from YouTube

### Step 1: Choose Your Provider

#### Option 1: Cloudflare Stream (Recommended)

**Why Cloudflare Stream?**
- Built-in DRM protection
- No sharing capabilities
- Token-based access
- Global CDN
- Professional quality

**Setup:**
1. Sign up for Cloudflare Stream: https://www.cloudflare.com/products/cloudflare-stream/
2. Get your Account ID and API Token
3. Upload videos to Cloudflare Stream
4. Get the Stream ID for each video

**Environment Variables:**
```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

**Update Video in Database:**
```javascript
// For each video in your course
video.cloudflareStreamId = "your_stream_id_here";
```

#### Option 2: Vimeo Pro

**Why Vimeo Pro?**
- Domain-level restrictions
- Signed embeds
- No YouTube branding
- Good for paid content

**Setup:**
1. Sign up for Vimeo Pro: https://vimeo.com/pro
2. Upload videos to Vimeo Pro
3. Enable domain restrictions in Vimeo settings
4. Get your Access Token

**Environment Variables:**
```env
VIMEO_ACCESS_TOKEN=your_vimeo_access_token
```

**Update Video in Database:**
```javascript
// For each video in your course
video.vimeoProVideoId = "your_vimeo_video_id";
```

#### Option 3: AWS S3 + CloudFront

**Why AWS?**
- Full control
- Self-hosted
- Signed URLs
- Cost-effective at scale

**Setup:**
1. Upload videos to S3 bucket
2. Set up CloudFront distribution
3. Configure CloudFront key pair
4. Set up signed URL generation

**Environment Variables:**
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
CLOUDFRONT_KEY_PAIR_ID=your_key_pair_id
CLOUDFRONT_PRIVATE_KEY=your_private_key_content
```

**Update Video in Database:**
```javascript
// For each video in your course
video.awsVideoKey = "videos/course-name/video-name.mp4";
```

### Step 2: Update Environment Variables

Add the required environment variables to your `.env.local` file:

```env
# Choose one provider (or support multiple)

# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# OR Vimeo Pro
VIMEO_ACCESS_TOKEN=

# OR AWS S3 + CloudFront
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
CLOUDFRONT_DOMAIN=
CLOUDFRONT_KEY_PAIR_ID=
CLOUDFRONT_PRIVATE_KEY=
```

### Step 3: Update Video Data

For each video in your courses, update the database with the secure video provider ID:

**Example using MongoDB:**
```javascript
// Update a video to use Cloudflare Stream
db.courses.updateOne(
  { "videos._id": ObjectId("video_id") },
  { $set: { "videos.$.cloudflareStreamId": "your_stream_id" } }
);
```

**Example using Admin Panel:**
Add fields to your admin video editor:
- Cloudflare Stream ID
- Vimeo Pro Video ID
- AWS Video Key
- Secure Video URL

### Step 4: Update Video Page

The video page has been updated to use `SecureVideoPlayer` component. It automatically detects which provider to use based on the video data.

### Step 5: Test

1. Log in as a user who has purchased a course
2. Navigate to a video
3. Verify:
   - Video loads with secure token
   - Right-click is disabled
   - Download is prevented
   - No sharing options
   - Clean, professional UI

## Security Features

### Implemented Protections

1. **Token-Based Access**
   - Videos require server-side token generation
   - Tokens expire after 1 hour
   - Tokens are user-specific

2. **Right-Click Protection**
   - Context menu disabled on video player
   - Prevents "Save video as"

3. **Download Prevention**
   - `controlsList="nodownload"` on video element
   - No direct video URL exposure
   - Token-required access

4. **No Sharing**
   - No share buttons
   - No external links
   - No YouTube/Vimeo branding

5. **Authentication Required**
   - Only logged-in users can access
   - Course purchase verification
   - Preview videos accessible without purchase

## Component Usage

```jsx
import SecureVideoPlayer from '@/components/SecureVideoPlayer';

<SecureVideoPlayer
  courseId={courseId}
  video={video}
  onVideoEnd={handleVideoEnd}
  onVideoStart={handleVideoStart}
/>
```

## API Endpoint

The secure video access API is at:
```
GET /api/video/access?courseId={courseId}&videoId={videoId}&provider={provider}
```

**Response:**
```json
{
  "token": "secure_token",
  "url": "https://secure-video-url",
  "provider": "cloudflare",
  "expiresAt": 1234567890
}
```

## Migration Checklist

- [ ] Choose video provider (Cloudflare Stream recommended)
- [ ] Set up provider account and get credentials
- [ ] Add environment variables
- [ ] Upload videos to provider
- [ ] Update video records in database with provider IDs
- [ ] Test video playback for purchased users
- [ ] Test access control (non-purchased users should be blocked)
- [ ] Verify right-click protection
- [ ] Verify download prevention
- [ ] Remove YouTube embeds from paid courses

## Troubleshooting

### Video not loading
- Check environment variables are set correctly
- Verify video ID exists in provider
- Check API token permissions
- Review server logs for errors

### Access denied
- Verify user has purchased the course
- Check course access API endpoint
- Verify session is valid

### Token expired
- Tokens expire after 1 hour
- Component automatically refreshes tokens
- Check token generation logic

## Support

For issues or questions:
1. Check provider documentation
2. Review server logs
3. Verify environment variables
4. Test with a simple video first

