'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * YouTube Player Component
 * 
 * Features:
 * - Embeds YouTube unlisted videos on the website using privacy-enhanced mode
 * - Uses youtube-nocookie.com to remove Share and Watch Later buttons
 * - Access control for paid/free preview videos
 * - Responsive design
 * - Hides YouTube branding and related videos
 * - Prevents sharing by using session-based access and privacy-enhanced mode
 * - Autoplay control based on access
 */
const YouTubePlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = () => {
    if (!video?.youtubeUrl) return null;
    
    // Extract ID from various YouTube URL formats:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/embed/VIDEO_ID
    // https://youtube.com/watch?v=VIDEO_ID
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

  // Function to hide YouTube share button and copy link options
  const hideShareButton = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // Try to access iframe content to hide share button
      // Note: This may be blocked by CORS, but we try anyway
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) {
        // Hide all share-related elements including copy link
        const selectors = [
          '[aria-label*="Share"]',
          '[aria-label*="share"]',
          '[aria-label*="Copy"]',
          '[aria-label*="copy"]',
          '[title*="Share"]',
          '[title*="share"]',
          '[title*="Copy"]',
          '[title*="copy"]',
          '.ytp-share-button',
          '.ytp-share-panel',
          '[class*="share"]',
          '[class*="Share"]',
          '[id*="share"]',
          '[id*="Share"]',
          'button[aria-label*="link"]',
          'button[title*="link"]',
          '[data-tooltip*="Share"]',
          '[data-tooltip*="Copy"]'
        ];
        
        selectors.forEach(selector => {
          try {
            const elements = iframeDoc.querySelectorAll(selector);
            elements.forEach(btn => {
              if (btn) {
                btn.style.display = 'none !important';
                btn.style.visibility = 'hidden !important';
                btn.style.opacity = '0 !important';
                btn.style.pointerEvents = 'none !important';
                btn.style.width = '0 !important';
                btn.style.height = '0 !important';
                btn.style.overflow = 'hidden !important';
              }
            });
          } catch (e) {
            // Ignore selector errors
          }
        });
      }
    } catch (e) {
      // CORS may block this, which is expected
      // This is normal for cross-origin iframes
    }
  };

  // Prevent sharing via keyboard shortcuts and other methods
  useEffect(() => {
    const preventSharing = (e) => {
      // Prevent Ctrl+C, Ctrl+A, Ctrl+S, Ctrl+P, F12 (DevTools)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'a' || e.key === 's' || e.key === 'p' || e.key === 'u')) {
        e.preventDefault();
        return false;
      }
      // Prevent F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Prevent right-click context menu
      if (e.button === 2) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent text selection and copying
    const preventSelection = (e) => {
      if (e.target.closest('.relative.bg-black')) {
        e.preventDefault();
        return false;
      }
    };

    // Prevent drag and drop
    const preventDrag = (e) => {
      if (e.target.closest('.relative.bg-black')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('keydown', preventSharing);
    document.addEventListener('contextmenu', preventSharing);
    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventDrag);
    document.addEventListener('copy', (e) => {
      if (window.getSelection().toString().includes(window.location.href)) {
        e.preventDefault();
        return false;
      }
    });

    return () => {
      document.removeEventListener('keydown', preventSharing);
      document.removeEventListener('contextmenu', preventSharing);
      document.removeEventListener('selectstart', preventSelection);
      document.removeEventListener('dragstart', preventDrag);
    };
  }, []);

  // Handle YouTube player events
  useEffect(() => {
    if (!hasAccess || !iframeRef.current) return;

    const iframe = iframeRef.current;
    
    // Listen for YouTube player events via postMessage
    const handleMessage = (event) => {
      // Verify message is from YouTube (including privacy-enhanced mode)
      if (!event.origin.includes('youtube.com') && !event.origin.includes('youtube-nocookie.com')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // YouTube iframe API events
        if (data.event === 'onReady') {
          setIsLoading(false);
          hideShareButton(); // Try to hide share button when player is ready
          if (onVideoStart) onVideoStart(video);
        } else if (data.event === 'onStateChange') {
          // State 0 = ended, 1 = playing, 2 = paused
          if (data.info === 0) {
            // Video ended
            if (onVideoEnd) onVideoEnd(video);
          } else if (data.info === 1) {
            // Video playing
            setIsLoading(false);
            hideShareButton(); // Try to hide share button when playing
          }
        } else if (data.event === 'onError') {
          setError('Error playing video. Please check if the video is available.');
          setIsLoading(false);
        }
      } catch (e) {
        // Ignore parsing errors for non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Periodically try to hide share button (in case it appears later)
    const shareButtonInterval = setInterval(() => {
      hideShareButton();
    }, 1000); // Check every second

    // Use MutationObserver to detect and hide share buttons as they appear
    const observer = new MutationObserver(() => {
      hideShareButton();
    });

    // Observe the iframe container for changes
    if (iframe && iframe.parentElement) {
      observer.observe(iframe.parentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'aria-label', 'title']
      });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      clearInterval(shareButtonInterval);
      observer.disconnect();
    };
  }, [hasAccess, video, onVideoStart, onVideoEnd]);

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

  // Build YouTube embed URL with privacy-enhanced mode (youtube-nocookie.com)
  // This removes the Share button, Watch Later button, and YouTube logo
  const youtubeEmbedUrl = `https://www.youtube-nocookie.com/embed/${youtubeVideoId}?` + new URLSearchParams({
    autoplay: '0', // Don't autoplay - let user control
    rel: '0', // Don't show related videos from other channels
    modestbranding: '1', // Reduce YouTube branding (hides YouTube logo)
    iv_load_policy: '3', // Hide video annotations
    cc_load_policy: '0', // Don't show captions by default
    fs: '1', // Allow fullscreen
    playsinline: '1', // Play inline on mobile
    origin: typeof window !== 'undefined' ? window.location.origin : '', // Prevent embedding elsewhere
    enablejsapi: '1', // Enable JavaScript API for events
    widget_referrer: typeof window !== 'undefined' ? window.location.origin : '', // Set referrer
    controls: '1', // Show controls
    disablekb: '0', // Allow keyboard controls
    loop: '0', // Don't loop
    mute: '0', // Don't mute
    showinfo: '0', // Hide video info (legacy, but helps)
    branding: '0' // Hide YouTube branding completely
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

      {/* YouTube iframe - Using privacy-enhanced mode (youtube-nocookie.com) to remove Share button */}
      <iframe
        ref={iframeRef}
        src={youtubeEmbedUrl}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'auto'
        }}
        onLoad={() => {
          // Give YouTube a moment to initialize
          setTimeout(() => {
            setIsLoading(false);
            // Additional attempt to hide any remaining share elements
            hideShareButton();
          }, 1500);
        }}
        // Prevent right-click and other sharing methods
        onContextMenu={(e) => {
          // Only prevent context menu, but allow video controls
          // Don't block if it's a video control interaction
          const target = e.target;
          if (target && (
            target.closest('[class*="share"]') ||
            target.closest('[aria-label*="Share"]') ||
            target.closest('[aria-label*="Copy"]') ||
            target.closest('[title*="Share"]') ||
            target.closest('[title*="Copy"]')
          )) {
            e.preventDefault();
            return false;
          }
        }}
      />
      
      {/* Blocker for top-right corner where share/copy link buttons appear */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 z-40"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed'
        }}
        onClick={(e) => {
          // Block clicks in the top-right corner where share buttons are
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />
      
      {/* Blocker for bottom-right corner where YouTube logo appears */}
      <div 
        className="absolute bottom-0 right-0 w-32 h-16 z-40"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed'
        }}
        onClick={(e) => {
          // Block clicks on YouTube logo in bottom-right corner
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onMouseEnter={(e) => {
          // Change cursor to indicate this area is blocked
          e.currentTarget.style.cursor = 'not-allowed';
        }}
      />
      
      {/* CSS to aggressively hide all share, copy link, and YouTube branding elements */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide all share and copy link buttons - comprehensive selectors */
        iframe[src*="youtube-nocookie.com"],
        iframe[src*="youtube.com"] {
          /* Ensure iframe itself doesn't show share options */
        }
        
        /* Hide any share-related elements outside iframe */
        [class*="share"],
        [class*="Share"],
        [id*="share"],
        [id*="Share"],
        [aria-label*="Share"],
        [aria-label*="share"],
        [aria-label*="Copy"],
        [aria-label*="copy"],
        [aria-label*="Copy link"],
        [aria-label*="copy link"],
        [title*="Share"],
        [title*="share"],
        [title*="Copy"],
        [title*="copy"],
        [title*="Copy link"],
        [data-tooltip*="Share"],
        [data-tooltip*="Copy"],
        button[aria-label*="link"],
        button[title*="link"],
        .ytp-share-button,
        .ytp-share-panel,
        [class*="ytp-share"],
        [class*="ytp-copy"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          left: -9999px !important;
        }
        
        /* Hide YouTube logo and branding */
        .ytp-watermark,
        .ytp-watermark-logo,
        [class*="ytp-watermark"],
        [class*="ytp-branding"],
        [id*="ytp-watermark"],
        [id*="ytp-branding"],
        a[href*="youtube.com"][class*="ytp"],
        a[href*="youtube.com"][id*="ytp"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
        }
        
        /* Hide share overlays and modals */
        [class*="share-overlay"],
        [class*="share-modal"],
        [class*="share-panel"],
        [id*="share-overlay"],
        [id*="share-modal"],
        [id*="share-panel"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}} />
    </div>
  );
};

export default YouTubePlayer;

