'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Secure Custom YouTube Player
 * 
 * Features:
 * - Obfuscated video ID (Base64 encoded)
 * - Dynamic iframe loading (no hardcoded iframe)
 * - Custom UI with no YouTube branding
 * - Watermark with user email/ID
 * - Maximum sharing prevention
 * - Mobile and desktop compatible
 */
const CustomYouTubePlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const iframeContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const [watermarkText, setWatermarkText] = useState('');

  // Obfuscate/deobfuscate video ID using Base64
  const obfuscateVideoId = (videoId) => {
    if (!videoId) return null;
    try {
      return btoa(videoId).replace(/[+/=]/g, (m) => {
        return { '+': '-', '/': '_', '=': '' }[m];
      });
    } catch (e) {
      return null;
    }
  };

  const deobfuscateVideoId = (obfuscated) => {
    if (!obfuscated) return null;
    try {
      const base64 = obfuscated.replace(/[-_]/g, (m) => {
        return { '-': '+', '_': '/' }[m];
      });
      return atob(base64);
    } catch (e) {
      return null;
    }
  };

  // Extract and obfuscate YouTube video ID from URL
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

  // Set watermark text based on user
  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || '';
      const userId = session.user.id || '';
      // Create watermark: email prefix or user ID
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
      
      if (video?.isFreePreview || video?.isPreview) {
        setHasAccess(true);
        setIsCheckingAccess(false);
        return;
      }

      if (!session) {
        setHasAccess(false);
        setIsCheckingAccess(false);
        return;
      }

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

  // Load YouTube IFrame API and create player dynamically
  useEffect(() => {
    if (!hasAccess) return;

    const videoId = getYouTubeVideoId();
    if (!videoId) {
      setError('No video ID found');
      setIsLoading(false);
      return;
    }

    // Obfuscate video ID
    const obfuscatedId = obfuscateVideoId(videoId);
    if (!obfuscatedId) {
      setError('Failed to process video ID');
      setIsLoading(false);
      return;
    }

    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    const initializePlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initializePlayer, 100);
        return;
      }

      const container = iframeContainerRef.current;
      if (!container) {
        setTimeout(initializePlayer, 100);
        return;
      }

      // Deobfuscate video ID
      const actualVideoId = deobfuscateVideoId(obfuscatedId);
      if (!actualVideoId) {
        setError('Invalid video ID');
        setIsLoading(false);
        return;
      }

      // Clear any existing player
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }

      // Clear container
      container.innerHTML = '';

      // Create unique player ID
      const playerId = `yt-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create container div for iframe (dynamically, not hardcoded)
      const playerDiv = document.createElement('div');
      playerDiv.id = playerId;
      playerDiv.style.cssText = 'width: 100%; height: 100%; position: absolute; top: 0; left: 0;';
      container.appendChild(playerDiv);

      // Create YouTube player with all restrictive parameters
      // Note: Use youtube-nocookie.com by using the embed URL format
      try {
        playerRef.current = new window.YT.Player(playerId, {
          videoId: actualVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0, // Completely hide controls
            disablekb: 1, // Disable keyboard controls
            fs: 0, // Disable fullscreen button
            iv_load_policy: 3, // Hide annotations
            modestbranding: 1, // Hide YouTube logo
            playsinline: 1,
            rel: 0, // Don't show related videos
            showinfo: 0,
            enablejsapi: 1,
            origin: window.location.origin,
            cc_load_policy: 0, // Hide captions
            branding: 0, // Hide all branding
            wmode: 'transparent',
            loop: 0
          },
          events: {
            onReady: (event) => {
              setIsLoading(false);
              setIframeLoaded(true);
              const player = event.target;
              try {
                // Verify player is ready
                if (typeof player.playVideo === 'function') {
                  setDuration(player.getDuration());
                  setVolume(player.getVolume() / 100);
                  setIsMuted(player.isMuted());
                  if (onVideoStart) onVideoStart(video);
                } else {
                  setError('Player not properly initialized');
                  setIsLoading(false);
                }
              } catch (e) {
                console.error('Error in onReady:', e);
                setError('Error initializing player');
                setIsLoading(false);
              }
            },
            onStateChange: (event) => {
              const player = event.target;
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setCurrentTime(0);
                if (onVideoEnd) onVideoEnd(video);
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setError('Error loading video');
              setIsLoading(false);
            }
          }
        });
      } catch (e) {
        console.error('Error creating YouTube player:', e);
        setError('Failed to create video player');
        setIsLoading(false);
      }
    };

    if (window.YT && window.YT.Player) {
      initializePlayer();
    } else {
      // Store previous callback if exists
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initializePlayer();
      };
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore cleanup errors
        }
        playerRef.current = null;
      }
      if (iframeContainerRef.current) {
        iframeContainerRef.current.innerHTML = '';
      }
      setIframeLoaded(false);
    };
  }, [hasAccess, video?.youtubeUrl, courseId, onVideoStart, onVideoEnd]);

  // Update current time
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return;

    const interval = setInterval(() => {
      try {
        const current = playerRef.current.getCurrentTime();
        setCurrentTime(current);
      } catch (e) {
        // Ignore errors
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle controls visibility
  useEffect(() => {
    if (!showControls) return;

    const resetTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    resetTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying, currentTime]);

  // Prevent all sharing methods
  useEffect(() => {
    // Block keyboard shortcuts
    const preventShortcuts = (e) => {
      // Block Ctrl+U (View Source), Ctrl+S (Save), Ctrl+C (Copy), Ctrl+Shift+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && (
        e.key === 'u' || e.key === 's' || e.key === 'c' || 
        (e.shiftKey && e.key === 'I') || e.key === 'F12'
      )) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block right-click
    const preventContextMenu = (e) => {
      if (containerRef.current?.contains(e.target)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Block text selection
    const preventSelection = (e) => {
      if (containerRef.current?.contains(e.target)) {
        e.preventDefault();
        return false;
      }
    };

    // Block drag
    const preventDrag = (e) => {
      if (containerRef.current?.contains(e.target)) {
        e.preventDefault();
        return false;
      }
    };

    // Block YouTube navigation
    const preventYouTubeNavigation = (e) => {
      const target = e.target;
      const link = target?.closest('a[href*="youtube.com"]') || 
                   target?.closest('a[href*="youtu.be"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return false;
      }
    };

    // Block touch events on mobile
    const preventTouchNavigation = (e) => {
      const target = e.target;
      const videoContainer = target?.closest('.custom-video-container');
      if (videoContainer && !target?.closest('.custom-controls')) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', preventShortcuts, true);
    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('dragstart', preventDrag, true);
    document.addEventListener('click', preventYouTubeNavigation, true);
    document.addEventListener('mousedown', preventYouTubeNavigation, true);
    document.addEventListener('touchstart', preventTouchNavigation, true);
    document.addEventListener('touchend', preventTouchNavigation, true);
    document.addEventListener('touchmove', preventTouchNavigation, true);

    return () => {
      document.removeEventListener('keydown', preventShortcuts, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('dragstart', preventDrag, true);
      document.removeEventListener('click', preventYouTubeNavigation, true);
      document.removeEventListener('mousedown', preventYouTubeNavigation, true);
      document.removeEventListener('touchstart', preventTouchNavigation, true);
      document.removeEventListener('touchend', preventTouchNavigation, true);
      document.removeEventListener('touchmove', preventTouchNavigation, true);
    };
  }, []);

  // Intercept clipboard API to replace YouTube links
  useEffect(() => {
    const fakeLink = 'https://example.com/invalid-video-link-404';
    
    // Intercept navigator.clipboard.writeText
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async function(text) {
        if (text && (
          text.includes('youtube.com') ||
          text.includes('youtu.be') ||
          text.includes('youtube-nocookie.com')
        )) {
          const replacedText = text
            .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
          return originalWriteText(replacedText || fakeLink);
        }
        return originalWriteText(text);
      };
    }

    // Intercept document.execCommand('copy')
    const originalExecCommand = document.execCommand;
    document.execCommand = function(command, showUI, value) {
      if (command === 'copy') {
        const selection = window.getSelection().toString();
        if (selection && (
          selection.includes('youtube.com') ||
          selection.includes('youtu.be') ||
          selection.includes('youtube-nocookie.com')
        )) {
          const replacedText = selection
            .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
          
          const textarea = document.createElement('textarea');
          textarea.value = replacedText || fakeLink;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          const result = originalExecCommand.apply(document, ['copy', false, null]);
          document.body.removeChild(textarea);
          return result;
        }
      }
      return originalExecCommand.apply(document, arguments);
    }

    // Intercept copy event
    const handleCopy = (e) => {
      const selection = window.getSelection().toString();
      const clipboardData = e.clipboardData || window.clipboardData;
      
      if (selection && (
        selection.includes('youtube.com') ||
        selection.includes('youtu.be') ||
        selection.includes('youtube-nocookie.com')
      )) {
        e.preventDefault();
        const replacedText = selection
          .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
        if (clipboardData) {
          clipboardData.setData('text/plain', replacedText || fakeLink);
        }
        return false;
      }
    };

    // Continuous clipboard monitoring
    const clipboardMonitor = setInterval(() => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('youtube-nocookie.com'))) {
            const replacedText = text.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
            if (replacedText !== text) {
              navigator.clipboard.writeText(replacedText || fakeLink).catch(() => {});
            }
          }
        }).catch(() => {});
      }
    }, 300);

    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('beforecopy', handleCopy, true);

    return () => {
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('beforecopy', handleCopy, true);
      clearInterval(clipboardMonitor);
    };
  }, []);

  // Control functions
  const togglePlay = () => {
    if (!playerRef.current) {
      console.warn('Player not initialized yet');
      return;
    }
    
    // Check if player methods exist
    if (typeof playerRef.current.playVideo !== 'function' || 
        typeof playerRef.current.pauseVideo !== 'function') {
      console.error('Player methods not available');
      setError('Player not ready. Please refresh the page.');
      return;
    }
    
    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    } catch (e) {
      console.error('Error toggling play:', e);
      setError('Error controlling video playback');
    }
  };

  const handleSeek = (e) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    try {
      playerRef.current.seekTo(newTime, true);
      setCurrentTime(newTime);
    } catch (e) {
      console.error('Error seeking:', e);
    }
  };

  const handleVolumeChange = (e) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newVolume = Math.max(0, Math.min(1, clickX / width));
    try {
      playerRef.current.setVolume(newVolume * 100);
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    } catch (e) {
      console.error('Error changing volume:', e);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.error('Error toggling mute:', e);
    }
  };

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement;
      
      const isFull = fullscreenElement === containerRef.current;
      setIsFullscreen(isFull);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.error('Error entering fullscreen:', err);
        });
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error('Error exiting fullscreen:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
      ref={containerRef}
      className="custom-video-container relative bg-black rounded-lg overflow-hidden aspect-video"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => {
        if (!isPlaying) setShowControls(true);
      }}
      onClick={(e) => {
        if (e.target.closest('.custom-controls')) return;
        if (showControls) {
          togglePlay();
        }
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
      }}
      onTouchEnd={(e) => {
        e.stopPropagation();
        if (e.target.closest('.custom-controls')) return;
        if (showControls) {
          togglePlay();
        }
      }}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {/* Dynamic iframe container - created via JavaScript, not hardcoded */}
      {hasAccess && (
        <div 
          ref={iframeContainerRef}
          className="absolute inset-0 w-full h-full"
          style={{
            zIndex: 1,
            pointerEvents: 'none' // Block all pointer events on iframe
          }}
        />
      )}

      {/* Full overlay to block all clicks/touches - especially important for mobile */}
      <div
        className="absolute inset-0 z-10"
        style={{
          pointerEvents: 'auto',
          touchAction: 'none'
        }}
        onClick={(e) => {
          if (e.target.closest('.custom-controls')) {
            e.stopPropagation();
            return;
          }
          if (showControls) {
            togglePlay();
          }
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          if (e.target.closest('.custom-controls')) return;
          if (showControls) {
            togglePlay();
          }
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      />

      {/* Blockers for top-left and top-right corners to hide YouTube UI */}
      <div
        className="absolute top-0 left-0 z-40"
        style={{
          width: '100px',
          height: '70px',
          pointerEvents: 'auto',
          cursor: 'not-allowed',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          touchAction: 'none'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />
      
      <div
        className="absolute top-0 right-0 z-40"
        style={{
          width: '120px',
          height: '70px',
          pointerEvents: 'auto',
          cursor: 'not-allowed',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          touchAction: 'none'
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      />

      {/* Watermark overlay - shows user email/ID */}
      {watermarkText && (
        <div
          className="absolute top-4 right-4 z-50 pointer-events-none"
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '14px',
            fontFamily: 'monospace',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
            userSelect: 'none'
          }}
        >
          {watermarkText}
        </div>
      )}

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
                if (playerRef.current) {
                  const videoId = getYouTubeVideoId();
                  if (videoId) {
                    playerRef.current.loadVideoById(videoId);
                  }
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Custom Controls Overlay - Modern, Clean UI */}
      {showControls && (
        <div 
          className="custom-controls absolute inset-0 z-20 flex flex-col justify-end"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
          
          {/* Progress Bar - Modern Design */}
          <div className="relative z-30 px-4 pb-2">
            <div 
              className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group relative"
              onClick={handleSeek}
              onTouchEnd={(e) => {
                e.stopPropagation();
                handleSeek(e);
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-150 relative"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"></div>
              </div>
            </div>
          </div>

          {/* Controls Bar - Modern Design */}
          <div className="relative z-30 flex items-center justify-between px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Play/Pause Button - Large, Modern */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="text-white hover:text-red-500 transition-all duration-200 transform hover:scale-110 touch-manipulation"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{ touchAction: 'manipulation' }}
              >
                {isPlaying ? (
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                ) : (
                  <svg className="w-8 h-8 md:w-10 md:h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                )}
              </button>

              {/* Volume Control - Modern Slider */}
              <div className="flex items-center space-x-2 md:space-x-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="text-white hover:text-red-500 transition-colors touch-manipulation"
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  style={{ touchAction: 'manipulation' }}
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  )}
                </button>
                <div 
                  className="w-16 md:w-24 h-1.5 bg-white/20 rounded-full cursor-pointer group relative touch-manipulation"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(e);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleVolumeChange(e);
                  }}
                  style={{ touchAction: 'manipulation' }}
                >
                  <div 
                    className="h-full bg-gradient-to-r from-white to-red-500 rounded-full transition-all"
                    style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
              </div>

              {/* Time Display - Modern Typography */}
              <div className="text-white text-xs md:text-sm font-medium tracking-wide hidden sm:block">
                <span className="text-red-400">{formatTime(currentTime)}</span>
                <span className="text-white/60 mx-1">/</span>
                <span className="text-white/80">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="text-white hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/10 touch-manipulation"
                aria-label="Fullscreen"
                style={{ touchAction: 'manipulation' }}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completely hide YouTube UI and branding */}
      <style dangerouslySetInnerHTML={{__html: `
        /* YouTube iframe - make sure video is visible but UI is hidden */
        .custom-video-container iframe {
          z-index: 1 !important;
          border: none !important;
          pointer-events: none !important;
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        
        /* Hide any YouTube-related elements */
        .custom-video-container [class*="ytp"]:not(iframe),
        .custom-video-container [id*="ytp"]:not(iframe),
        .custom-video-container [class*="youtube"]:not(iframe),
        .custom-video-container [id*="youtube"]:not(iframe),
        .custom-video-container [aria-label*="YouTube"]:not(iframe),
        .custom-video-container [aria-label*="Share"]:not(iframe),
        .custom-video-container [aria-label*="Copy"]:not(iframe),
        .custom-video-container [title*="YouTube"]:not(iframe),
        .custom-video-container [title*="Share"]:not(iframe),
        .custom-video-container [title*="Copy"]:not(iframe),
        .custom-video-container a[href*="youtube.com"]:not(iframe),
        .custom-video-container a[href*="youtu.be"]:not(iframe),
        .custom-video-container button[aria-label*="YouTube"]:not(iframe),
        .custom-video-container button[aria-label*="Share"]:not(iframe) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}} />
    </div>
  );
};

export default CustomYouTubePlayer;
