'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Vimeo Player Component
 * 
 * Features:
 * - Embeds Vimeo video player
 * - Access control for paid/free preview videos
 * - Responsive design
 * - Hides download button and branding
 * - Autoplay control based on access
 */
const VimeoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Extract Vimeo video ID from URL or use direct ID
  const getVimeoVideoId = () => {
    if (video?.vimeoVideoId) {
      return video.vimeoVideoId;
    }
    
    if (video?.vimeoUrl) {
      // Extract ID from various Vimeo URL formats:
      // https://vimeo.com/123456789
      // https://player.vimeo.com/video/123456789
      // https://vimeo.com/123456789?param=value
      const match = video.vimeoUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // Check if user has access to this video
  useEffect(() => {
    const checkAccess = async () => {
      setIsCheckingAccess(true);
      
      // Free preview videos are always accessible
      if (video?.isFreePreview || video?.isPreview) {
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      // If not logged in and not a preview, no access
      if (!session) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }

      // Check if user has purchased the course
      try {
        const response = await fetch(`/api/courses/${courseId}/access`);
        if (response.ok) {
          const data = await response.json();
          setHasAccess(data.hasAccess || false);
        } else {
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [session, courseId, video?.isFreePreview, video?.isPreview]);

  // Handle Vimeo player ready
  useEffect(() => {
    if (!hasAccess || !iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Listen for Vimeo player events
    const handleMessage = (event) => {
      // Verify message is from Vimeo
      if (!event.origin.includes('vimeo.com')) return;

      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

      switch (data.event) {
        case 'ready':
          setIsLoading(false);
          if (onVideoStart) onVideoStart(video);
          break;
        case 'play':
          setIsLoading(false);
          break;
        case 'pause':
          break;
        case 'ended':
          if (onVideoEnd) onVideoEnd(video);
          break;
        case 'error':
          setError('Error playing video. Please try again.');
          setIsLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [hasAccess, video, onVideoStart, onVideoEnd]);

  const vimeoVideoId = getVimeoVideoId();

  // Show loading state
  if (isCheckingAccess) {
    return (
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Checking access...</p>
        </div>
      </div>
    );
  }

  // Show error if no Vimeo video ID
  if (!vimeoVideoId) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Video Not Available</h3>
          <p className="text-gray-400">No Vimeo video ID found for this video.</p>
        </div>
      </div>
    );
  }

  // Show purchase prompt if no access
  if (!hasAccess) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/course/${courseId}/video/${video?._id}`;
    const purchaseUrl = `/purchase/${courseId}`;
    
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white p-8 max-w-md">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-2xl font-semibold mb-3">Premium Content</h3>
          <p className="text-gray-300 mb-6">
            Please purchase this course to continue watching this video.
          </p>
          {session ? (
            <button
              onClick={() => router.push(purchaseUrl)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Purchase Course
            </button>
          ) : (
            <button
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Login to Purchase
            </button>
          )}
        </div>
      </div>
    );
  }

  // Build Vimeo embed URL with privacy settings
  const vimeoEmbedUrl = `https://player.vimeo.com/video/${vimeoVideoId}?` + new URLSearchParams({
    autoplay: '0', // Don't autoplay - let user control
    title: '0', // Hide title
    byline: '0', // Hide byline
    portrait: '0', // Hide portrait
    badge: '0', // Hide badge
    controls: '1', // Show controls
    responsive: '1', // Responsive
    dnt: '1', // Do not track
  }).toString();

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
          <div className="text-center text-white p-6">
            <p className="mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Vimeo iframe */}
      <iframe
        ref={iframeRef}
        src={vimeoEmbedUrl}
        className="w-full h-full"
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};

export default VimeoPlayer;







