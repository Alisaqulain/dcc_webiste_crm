'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom Video Player with Zoom, Quality, and Fullscreen
 * 
 * Features:
 * - Custom controls overlay (blocks YouTube UI clicks)
 * - Zoom in/out functionality
 * - Video quality selection
 * - Fullscreen support
 * - Clean UI with no shadows
 */
const CustomVideoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  
  // Custom controls state
  const [showControls, setShowControls] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [availableQualities, setAvailableQualities] = useState([]);

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

  // Load YouTube iframe API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      return;
    }

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (existingScript) {
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        console.log('YouTube iframe API ready');
      };
    }
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    if (!hasAccess || !containerRef.current) return;

    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100);
        return;
      }

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {}
        }

        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: videoId,
          playerVars: {
            origin: typeof window !== 'undefined' ? window.location.origin : '',
            enablejsapi: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            cc_load_policy: 0,
            playsinline: 1,
            controls: 0, // Hide YouTube controls - we use custom controls
            fs: 0, // We handle fullscreen ourselves
            disablekb: 1, // Disable keyboard to prevent conflicts
            autoplay: 0,
            loop: 0,
            mute: 0,
          },
          host: 'https://www.youtube-nocookie.com',
          events: {
            onReady: (event) => {
              console.log('YouTube player ready');
              setIsLoading(false);
              setPlayerReady(true);
              
              // Get available quality levels
              try {
                const qualities = event.target.getAvailableQualityLevels();
                setAvailableQualities(qualities || []);
                const current = event.target.getPlaybackQuality();
                setCurrentQuality(current || 'auto');
              } catch (e) {
                console.log('Could not get quality levels');
              }
              
              if (onVideoStart) onVideoStart(video);
            },
            onStateChange: (event) => {
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

    initPlayer();

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [hasAccess, video, courseId, onVideoStart, onVideoEnd]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  // Prevent all clicks on YouTube UI elements
  useEffect(() => {
    const preventAllClicks = (e) => {
      // Only allow clicks on our custom controls
      if (!e.target.closest('.custom-video-controls') && 
          !e.target.closest('.custom-control-button')) {
        // If clicking on iframe or YouTube elements, prevent
        if (e.target.closest('.youtube-player-container') || 
            e.target.tagName === 'IFRAME') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      }
    };

    const preventContextMenu = (e) => {
      if (e.target.closest('.youtube-player-container')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('click', preventAllClicks, true);
    document.addEventListener('contextmenu', preventContextMenu, true);

    return () => {
      document.removeEventListener('click', preventAllClicks, true);
      document.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, []);

  // Player control functions
  const handlePlay = () => {
    if (playerRef.current) {
      playerRef.current.playVideo();
    }
  };

  const handlePause = () => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2)); // Max 2x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1)); // Min 1x zoom
  };

  const handleQualityChange = (quality) => {
    if (playerRef.current) {
      try {
        playerRef.current.setPlaybackQuality(quality);
        setCurrentQuality(quality);
      } catch (e) {
        console.error('Error setting quality:', e);
      }
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.mozRequestFullScreen) {
        containerRef.current.mozRequestFullScreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const youtubeVideoId = getYouTubeVideoId();

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

  if (!youtubeVideoId) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Video Not Available</h3>
          <p className="text-gray-400">No valid YouTube video URL found.</p>
        </div>
      </div>
    );
  }

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
          <p className="text-gray-300 mb-6">Please purchase this course to continue watching.</p>
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
        ref={containerRef}
        className="youtube-player-container relative bg-black rounded-lg overflow-hidden aspect-video w-full"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          position: 'relative',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }}
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-30">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>Loading video...</p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-30">
            <div className="text-center text-white p-6">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* CRITICAL: Block all YouTube UI elements that leak video links */}
        
        {/* Top-left area - blocks video title/link leak */}
        <div 
          className="absolute top-0 left-0 w-64 h-24 z-15 pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
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
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            background: 'transparent',
            cursor: 'not-allowed',
            zIndex: 15,
          }}
          aria-hidden="true"
        />

        {/* Top-right area - blocks "Copy link" button */}
        <div 
          className="absolute top-0 right-0 w-48 h-24 z-15 pointer-events-auto"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
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
          onMouseUp={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          style={{
            background: 'transparent',
            cursor: 'not-allowed',
            zIndex: 15,
          }}
          aria-hidden="true"
        />

        {/* Bottom area - blocks YouTube logo and "Watch on YouTube" */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-20 z-15 pointer-events-auto"
          onClick={(e) => {
            if (!e.target.closest('.custom-video-controls')) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              return false;
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }}
          onMouseDown={(e) => {
            if (!e.target.closest('.custom-video-controls')) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onMouseUp={(e) => {
            if (!e.target.closest('.custom-video-controls')) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onTouchStart={(e) => {
            if (!e.target.closest('.custom-video-controls')) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onTouchEnd={(e) => {
            if (!e.target.closest('.custom-video-controls')) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          style={{
            background: 'transparent',
            cursor: 'not-allowed',
            zIndex: 15,
          }}
          aria-hidden="true"
        />

        {/* Additional full-coverage overlay for extra protection */}
        <div 
          className="absolute inset-0 z-5 pointer-events-none"
          style={{
            background: 'transparent',
          }}
          aria-hidden="true"
        />

        {/* Custom Controls Overlay */}
        {playerReady && (
          <div 
            className={`custom-video-controls absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            <div className="flex items-center justify-center space-x-6 text-white">
              {/* Zoom and Quality Controls */}
              <div className="flex items-center space-x-3 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/20">
                {/* Zoom Out */}
                <button
                  onClick={handleZoomOut}
                  className="custom-control-button p-2 bg-white/10 hover:bg-white/30 rounded transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Zoom Out"
                  disabled={zoomLevel <= 1}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13H5v-2h14v2z" />
                  </svg>
                </button>

                {/* Zoom Level Display */}
                <span className="text-sm font-mono px-2 text-white font-semibold min-w-[50px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                {/* Zoom In */}
                <button
                  onClick={handleZoomIn}
                  className="custom-control-button p-2 bg-white/10 hover:bg-white/30 rounded transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Zoom In"
                  disabled={zoomLevel >= 2}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </button>
              </div>

              {/* Quality and Fullscreen */}
              <div className="flex items-center space-x-3">
                {/* Quality Selector */}
                {availableQualities.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setShowControls(true)}
                      className="custom-control-button p-2 hover:bg-white/20 rounded transition-colors"
                      aria-label="Quality"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3zm0 2.84L16.16 10H15v6H9v-6H7.84L12 5.84z" />
                      </svg>
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden min-w-[120px]">
                      {['auto', 'hd1080', 'hd720', 'large', 'medium', 'small'].map((quality) => (
                        <button
                          key={quality}
                          onClick={() => handleQualityChange(quality)}
                          className={`block w-full text-left px-4 py-2 text-sm hover:bg-white/20 transition-colors ${
                            currentQuality === quality ? 'bg-red-600' : ''
                          }`}
                        >
                          {quality === 'auto' ? 'Auto' : quality.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fullscreen */}
                <button
                  onClick={handleFullscreen}
                  className="custom-control-button p-2 hover:bg-white/20 rounded transition-colors"
                  aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean CSS - Hide all YouTube UI, no shadows */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide ALL YouTube UI elements that can leak video links */
        .youtube-player-container iframe ~ *,
        .youtube-player-container .ytp-watermark,
        .youtube-player-container .ytp-watermark-logo,
        .youtube-player-container .ytp-branding-logo,
        .youtube-player-container .ytp-share-button,
        .youtube-player-container .ytp-title-link,
        .youtube-player-container .ytp-show-cards-title,
        .youtube-player-container .ytp-copylink-button,
        .youtube-player-container .ytp-chrome-top,
        /* Hide video title that shows link */
        .youtube-player-container .ytp-title,
        .youtube-player-container .ytp-title-text,
        .youtube-player-container .ytp-title-content,
        .youtube-player-container .ytp-title-expanded-content,
        .youtube-player-container .ytp-title-channel,
        /* Hide copy link button completely */
        .youtube-player-container button[aria-label*="Copy"],
        .youtube-player-container button[title*="Copy"],
        .youtube-player-container button[aria-label*="Copy link"],
        .youtube-player-container button[title*="Copy link"],
        .youtube-player-container .ytp-copylink-icon,
        /* Hide YouTube logo and branding */
        .youtube-player-container a[href*="youtube.com"],
        .youtube-player-container a[href*="youtu.be"],
        .youtube-player-container .ytp-watermark,
        /* Hide share menu */
        .youtube-player-container .ytp-share-panel,
        .youtube-player-container .ytp-share-button-visible {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }

        /* Remove all shadows and gradients */
        .youtube-player-container iframe,
        .youtube-player-container > div {
          background: transparent !important;
          box-shadow: none !important;
        }

        .youtube-player-container::before,
        .youtube-player-container::after {
          display: none !important;
        }

        /* Ensure iframe is clean */
        .youtube-player-container iframe {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          filter: none !important;
          background: transparent !important;
        }

        /* Hide YouTube controls completely */
        .youtube-player-container .ytp-chrome-bottom,
        .youtube-player-container .ytp-progress-bar-container {
          display: none !important;
        }

        /* Force hide any clickable elements in top areas */
        .youtube-player-container .ytp-chrome-top *,
        .youtube-player-container .ytp-title * {
          pointer-events: none !important;
          cursor: not-allowed !important;
        }

        /* Block iframe interactions in critical areas */
        .youtube-player-container iframe {
          pointer-events: auto !important;
        }

        /* Ensure blocking overlays are on top */
        .youtube-player-container [style*="z-index: 15"],
        .youtube-player-container [style*="z-index:15"] {
          z-index: 15 !important;
        }

        /* Custom controls styling */
        .custom-video-controls {
          pointer-events: auto !important;
        }

        .custom-control-button {
          pointer-events: auto !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .youtube-player-container {
            border-radius: 0.5rem;
          }
        }
      `}} />
    </>
  );
};

export default CustomVideoPlayer;

