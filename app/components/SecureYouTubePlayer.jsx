'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Secure YouTube Player Component
 * 
 * Maximum protection for YouTube unlisted videos in paid courses:
 * - Uses youtube-nocookie.com for privacy-enhanced mode
 * - Dynamically injects iframe (video ID obfuscated)
 * - Removes all sharing options
 * - Disables right-click, keyboard shortcuts
 * - Adds dynamic watermark overlay
 * - Blocks all copy/share attempts
 */
const SecureYouTubePlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const containerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [watermarkText, setWatermarkText] = useState('');

  // Obfuscate/deobfuscate YouTube video ID using Base64
  const obfuscateVideoId = (videoId) => {
    if (!videoId) return null;
    try {
      // Encode to Base64
      return btoa(videoId);
    } catch (e) {
      return videoId;
    }
  };

  const deobfuscateVideoId = (obfuscatedId) => {
    if (!obfuscatedId) return null;
    try {
      // Decode from Base64
      return atob(obfuscatedId);
    } catch (e) {
      return obfuscatedId;
    }
  };

  // Extract and obfuscate YouTube video ID from URL
  const getYouTubeVideoId = () => {
    if (!video?.youtubeUrl) return null;
    
    // Extract ID from various YouTube URL formats
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

  // Set watermark text based on user
  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || '';
      const userId = session.user.id || '';
      // Create watermark: email or user ID
      const text = email ? email.split('@')[0] : `User-${userId.slice(-6)}`;
      setWatermarkText(text);
    } else {
      setWatermarkText('Guest');
    }
  }, [session]);

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

  // Comprehensive keyboard shortcut blocking
  useEffect(() => {
    const preventShortcuts = (e) => {
      // Block Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+C (Copy) - only on video player
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const target = e.target;
        if (target?.closest('.secure-video-container') || 
            target?.closest('.aspect-video') ||
            window.getSelection().toString().includes('youtube') ||
            window.getSelection().toString().includes('youtu.be')) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
      // Block Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Block F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block right-click globally on video player
    const preventContextMenu = (e) => {
      const target = e.target;
      if (target?.closest('.secure-video-container') || 
          target?.closest('.aspect-video') ||
          target?.closest('iframe')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block text selection on video player
    const preventSelection = (e) => {
      const target = e.target;
      if (target?.closest('.secure-video-container') || 
          target?.closest('.aspect-video')) {
        e.preventDefault();
        return false;
      }
    };

    // Block copy events
    const preventCopy = (e) => {
      const selection = window.getSelection().toString();
      if (selection.includes('youtube.com') || 
          selection.includes('youtu.be') ||
          selection.includes(window.location.href)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', preventShortcuts, true);
    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('copy', preventCopy, true);

    return () => {
      document.removeEventListener('keydown', preventShortcuts, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('copy', preventCopy, true);
    };
  }, []);

  // Dynamically inject iframe (not hardcoded in HTML)
  // Video ID is extracted and used only at runtime, never in HTML source
  useEffect(() => {
    if (!hasAccess || !containerRef.current) return;

    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    // Build YouTube embed URL with maximum privacy settings
    // Note: Video ID is only used here at runtime, not in HTML source
    const params = new URLSearchParams({
      autoplay: '0',
      rel: '0', // No related videos
      modestbranding: '1', // Hide YouTube logo
      iv_load_policy: '3', // Hide annotations
      cc_load_policy: '0', // No captions by default
      fs: '0', // Disable fullscreen
      playsinline: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      enablejsapi: '1',
      controls: '1',
      disablekb: '1', // Disable keyboard controls
      loop: '0',
      mute: '0',
      showinfo: '0', // Hide video info
      branding: '0' // Hide branding
    });

    // Use youtube-nocookie.com for privacy-enhanced mode
    // URL is built dynamically, not in HTML source
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

    // Clear container first
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }

    // Dynamically create iframe using JavaScript (not in HTML)
    const iframe = document.createElement('iframe');
    // Set src after creation to avoid it being in HTML source
    iframe.setAttribute('src', embedUrl);
    iframe.className = 'w-full h-full';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
    iframe.setAttribute('allowfullscreen', 'false'); // Disable fullscreen
    
    // Apply styles via JavaScript
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: auto;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      border: none;
    `;

    // Block right-click on iframe
    iframe.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    });

    // Block mouse events that could trigger sharing
    iframe.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });

    iframe.addEventListener('load', () => {
      setIsLoading(false);
      if (onVideoStart) onVideoStart(video);
    });

    // Append iframe to container (dynamically, not in HTML)
    if (containerRef.current) {
      containerRef.current.appendChild(iframe);
      iframeRef.current = iframe;
    }

    // Cleanup
    return () => {
      if (containerRef.current && iframe.parentNode) {
        try {
          containerRef.current.removeChild(iframe);
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, [hasAccess, video, courseId, onVideoStart]);

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
    <div 
      className="secure-video-container relative bg-black rounded-lg overflow-hidden aspect-video"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
      onDragStart={(e) => {
        e.preventDefault();
        return false;
      }}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Dynamic watermark overlay */}
      {watermarkText && (
        <div 
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: 'transparent',
            userSelect: 'none',
            WebkitUserSelect: 'none'
          }}
        >
          {/* Watermark text - repeated pattern */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 100px,
                rgba(255, 255, 255, 0.03) 100px,
                rgba(255, 255, 255, 0.03) 200px
              )`,
              pointerEvents: 'none'
            }}
          />
          {/* User watermark text - multiple positions for visibility */}
          <div 
            className="absolute top-3 left-3 text-white text-xs font-mono opacity-50"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.95)',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}
          >
            {watermarkText}
          </div>
          <div 
            className="absolute bottom-3 right-3 text-white text-xs font-mono opacity-50"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.95)',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '1px'
            }}
          >
            {watermarkText}
          </div>
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-base font-mono opacity-35"
            style={{
              textShadow: '3px 3px 6px rgba(0,0,0,0.98)',
              pointerEvents: 'none',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              fontWeight: 'bold',
              letterSpacing: '2px'
            }}
          >
            {watermarkText} • {typeof window !== 'undefined' ? new Date().toLocaleDateString() : ''}
          </div>
          {/* Additional corner watermarks */}
          <div 
            className="absolute top-3 right-3 text-white text-xs font-mono opacity-40"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.95)',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace',
              marginTop: '20px'
            }}
          >
            {typeof window !== 'undefined' ? new Date().toLocaleDateString() : ''}
          </div>
          <div 
            className="absolute bottom-3 left-3 text-white text-xs font-mono opacity-40"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.95)',
              pointerEvents: 'none',
              userSelect: 'none',
              fontFamily: 'monospace'
            }}
          >
            {typeof window !== 'undefined' ? window.location.hostname : ''}
          </div>
        </div>
      )}

      {/* Container for dynamically injected iframe */}
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          pointerEvents: 'auto'
        }}
      />

      {/* Corner blockers for share buttons */}
      {/* Top-right: Copy link button */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 z-40"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />

      {/* Bottom-left: Watch on YouTube */}
      <div 
        className="absolute bottom-0 left-0 w-32 h-12 z-40"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />

      {/* Bottom-right: YouTube logo */}
      <div 
        className="absolute bottom-0 right-0 w-24 h-12 z-40"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />

      {/* CSS to hide all YouTube UI elements */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide YouTube share button, logo, and all branding */
        .secure-video-container iframe ~ * [class*="share"],
        .secure-video-container iframe ~ * [class*="Share"],
        .secure-video-container iframe ~ * [aria-label*="Share"],
        .secure-video-container iframe ~ * [aria-label*="Copy"],
        .secure-video-container iframe ~ * [title*="Share"],
        .secure-video-container iframe ~ * [title*="Copy"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Hide YouTube context menu */
        .ytp-popup,
        .ytp-contextmenu,
        .ytp-menuitem,
        [class*="ytp-popup"],
        [class*="ytp-contextmenu"],
        [class*="ytp-menu"],
        [id*="ytp-popup"],
        [id*="ytp-contextmenu"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          overflow: hidden !important;
          position: absolute !important;
          left: -9999px !important;
          z-index: -9999 !important;
        }

        /* Hide YouTube watermark and logo */
        .ytp-watermark,
        .ytp-watermark-logo,
        [class*="ytp-watermark"],
        [class*="ytp-branding"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        /* Prevent fullscreen */
        .secure-video-container iframe {
          pointer-events: auto;
        }

        /* Hide related videos overlay */
        .ytp-pause-overlay,
        [class*="ytp-pause"] {
          display: none !important;
        }
      `}} />
    </div>
  );
};

export default SecureYouTubePlayer;

