'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Production-Ready YouTube Video Player Component
 * 
 * Features:
 * - YouTube iframe API integration
 * - Fullscreen and quality selection enabled
 * - Clean UI with no black overlays
 * - Sharing and YouTube branding disabled
 * - Right-click protection
 * - Fully responsive for desktop and mobile
 * - Next.js App Router compatible
 */
const VideoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = () => {
    if (!video?.youtubeUrl) return null;
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
      const match = video.youtubeUrl.match(pattern);
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

  // Load YouTube iframe API
  useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      return;
    }

    // Load YouTube iframe API script
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Set up global callback for when API is ready (if not already set)
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube iframe API ready');
      };
    }
  }, []);

  // Initialize YouTube player with iframe API
  useEffect(() => {
    if (!hasAccess || !containerRef.current) return;

    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    // Wait for YouTube API to be ready
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        // Retry after a short delay
        setTimeout(initPlayer, 100);
        return;
      }

      try {
        // Destroy existing player if any
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {
            // Ignore destroy errors
          }
        }

        // Create new player instance
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            // Privacy and security
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            enablejsapi: 1,
            modestbranding: 1, // Hide YouTube logo
            rel: 0, // No related videos
            showinfo: 0, // Hide video info
            iv_load_policy: 3, // Hide annotations
            cc_load_policy: 0, // No captions by default
            playsinline: 1, // Play inline on mobile
            
            // Enable features
            controls: 1, // Show controls
            fs: 1, // Enable fullscreen
            disablekb: 0, // Enable keyboard controls (for quality selection)
            
            // Disable sharing
            autoplay: 0,
            loop: 0,
            mute: 0,
          },
          events: {
            onReady: (event) => {
              console.log('YouTube player ready');
              setIsLoading(false);
              setPlayerReady(true);
              if (onVideoStart) onVideoStart(video);
            },
            onStateChange: (event) => {
              // Video ended
              if (event.data === window.YT.PlayerState.ENDED) {
                if (onVideoEnd) onVideoEnd(video);
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setError('Error loading video. Please try again.');
              setIsLoading(false);
            }
          }
        });
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        setError('Failed to initialize video player.');
        setIsLoading(false);
      }
    };

    // Start initialization
    initPlayer();

    // Cleanup
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [hasAccess, video, courseId, onVideoStart, onVideoEnd]);

  // Prevent right-click and context menu
  useEffect(() => {
    const preventContextMenu = (e) => {
      const target = e.target;
      if (target?.closest('.video-player-container') || 
          target?.closest('iframe')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Prevent opening video in new tab
    const preventNewTab = (e) => {
      if (e.ctrlKey || e.metaKey) {
        const target = e.target;
        if (target?.closest('.video-player-container')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    };

    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('click', preventNewTab, true);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('click', preventNewTab, true);
    };
  }, []);

  const youtubeVideoId = getYouTubeVideoId();

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

  // Show error if no YouTube video ID
  if (!youtubeVideoId) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Video Not Available</h3>
          <p className="text-gray-400">No valid YouTube video URL found for this video.</p>
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

  return (
    <>
      <div 
        className="video-player-container relative bg-black rounded-lg overflow-hidden aspect-video w-full"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-20">
            <div className="text-center text-white p-6">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* YouTube player container */}
        <div 
          ref={containerRef}
          className="w-full h-full"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Clean CSS - Remove all YouTube overlays, shadows, and branding */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Remove black overlay/shadow on top of video */
        .video-player-container iframe,
        .video-player-container > div {
          background: transparent !important;
          box-shadow: none !important;
        }

        /* Remove YouTube top black bar */
        .ytp-chrome-top,
        .ytp-gradient-top,
        .ytp-show-cards-title {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
        }

        /* Remove YouTube watermark and logo */
        .ytp-watermark,
        .ytp-watermark-logo-container,
        .ytp-watermark-logo,
        .ytp-branding-logo,
        .ytp-branding-icon,
        a[href*="youtube.com"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide share button and sharing options */
        .ytp-share-button,
        .ytp-share-button-visible,
        .ytp-share-panel,
        button[aria-label*="Share"],
        button[title*="Share"],
        .ytp-menuitem[aria-label*="Share"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide "Watch on YouTube" link */
        .ytp-title-link,
        .ytp-title,
        a[href*="watch?v="] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide related videos overlay */
        .ytp-pause-overlay,
        .ytp-pause-overlay-container,
        .ytp-suggested-action,
        .ytp-ce-element {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }

        /* Remove any black overlays or shadows */
        .video-player-container::before,
        .video-player-container::after {
          display: none !important;
        }

        /* Ensure clean video display */
        .video-player-container iframe {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          filter: none !important;
        }

        /* Hide YouTube context menu */
        .ytp-popup,
        .ytp-contextmenu,
        .ytp-menuitem[aria-label*="Copy"],
        .ytp-menuitem[aria-label*="Share"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .video-player-container {
            border-radius: 0.5rem;
          }
        }

        /* Ensure quality selector is visible and working */
        .ytp-settings-button,
        .ytp-settings-menu {
          pointer-events: auto !important;
        }

        /* Clean player appearance */
        .ytp-chrome-bottom {
          background: transparent !important;
        }

        .ytp-progress-bar-container {
          background: rgba(255, 255, 255, 0.2) !important;
        }
      `}} />
    </>
  );
};

export default VideoPlayer;

