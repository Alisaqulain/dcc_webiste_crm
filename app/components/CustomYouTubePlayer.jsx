'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom Video Player Using YouTube (Hidden YouTube Player)
 * 
 * Uses YouTube URLs but with completely custom controls
 * - YouTube iframe is hidden
 * - All YouTube UI is blocked and hidden
 * - Custom controls overlay
 * - Zoom, Quality, Fullscreen
 */
const CustomYouTubePlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
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
  const [isMobile, setIsMobile] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
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

  // Check if user has access to this video (avoid depending on whole `session` — it refreshes often)
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
  }, [session?.user?.id, courseId, video?.isFreePreview, video?.isPreview]);

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

  const onVideoStartRef = useRef(onVideoStart);
  const onVideoEndRef = useRef(onVideoEnd);
  useEffect(() => {
    onVideoStartRef.current = onVideoStart;
    onVideoEndRef.current = onVideoEnd;
  }, [onVideoStart, onVideoEnd]);

  // Initialize YouTube player (hidden)
  useEffect(() => {
    if (!hasAccess || !containerRef.current) return;

    const videoId = getYouTubeVideoId();
    if (!videoId) return;

    let cancelled = false;
    let timeInterval = null;
    let pollTimer = null;

    const initPlayer = () => {
      if (cancelled) return;
      if (!window.YT || !window.YT.Player) {
        pollTimer = setTimeout(initPlayer, 100);
        return;
      }

      try {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch (e) {}
        }

        const host = containerRef.current;
        if (!host || cancelled) return;

        // Create YouTube player container (visible but YouTube UI hidden)
        const playerContainer = document.createElement('div');
        playerContainer.id = `youtube-player-${Date.now()}`;
        playerContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%;';
        host.appendChild(playerContainer);

        const videoRef = video;

        playerRef.current = new window.YT.Player(playerContainer.id, {
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
            controls: 0, // No YouTube controls
            fs: 0, // We handle fullscreen
            disablekb: 1,
            autoplay: 0,
            loop: 0,
            mute: 0,
          },
          host: 'https://www.youtube-nocookie.com',
          events: {
            onReady: (event) => {
              if (cancelled) return;
              console.log('YouTube player ready');
              setIsLoading(false);
              setPlayerReady(true);
              
              // Get available quality levels
              try {
                const qualities = event.target.getAvailableQualityLevels();
                setAvailableQualities(qualities || []);
                const current = event.target.getPlaybackQuality();
                setCurrentQuality(current || 'auto');
                
                // Get duration
                const dur = event.target.getDuration();
                setDuration(dur || 0);
              } catch (e) {
                console.log('Could not get quality levels');
              }
              
              onVideoStartRef.current?.(videoRef);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                onVideoEndRef.current?.(videoRef);
              }
            },
            onError: (event) => {
              console.error('YouTube player error:', event.data);
              setError('Error loading video. Please try again.');
              setIsLoading(false);
            }
          }
        });

        timeInterval = setInterval(() => {
          if (playerRef.current && playerRef.current.getCurrentTime) {
            try {
              const time = playerRef.current.getCurrentTime();
              setCurrentTime(time);
            } catch (e) {}
          }
        }, 250);
      } catch (error) {
        console.error('Error initializing YouTube player:', error);
        setError('Failed to initialize video player.');
        setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (timeInterval) clearInterval(timeInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {}
        playerRef.current = null;
      }
      const host = containerRef.current;
      if (host) {
        host.querySelectorAll('[id^="youtube-player-"]').forEach((el) => el.remove());
      }
    };
  }, [hasAccess, courseId, video?._id, video?.youtubeUrl]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Show controls on touch for mobile
  useEffect(() => {
    if (!isMobile || !containerRef.current) return;
    
    const handleTouchStart = () => {
      setShowControls(true);
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowControls(false);
      }, 5000);
    };

    const container = containerRef.current;
    container.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isMobile]);

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

  // Block stray YouTube UI clicks only inside the player — never on document (that broke navbar / whole page).
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const preventAllClicks = (e) => {
      if (!root.contains(e.target)) return;

      // Allow clicks in fullscreen mode (for video playback)
      if (document.fullscreenElement || document.webkitFullscreenElement || 
          document.mozFullScreenElement || document.msFullscreenElement) {
        if (e.target.closest('iframe') || e.target.tagName === 'IFRAME') {
          return;
        }
      }
      
      if (isMobile && (e.type === 'touchstart' || e.type === 'touchend')) {
        if ((document.fullscreenElement || document.webkitFullscreenElement || 
            document.mozFullScreenElement || document.msFullscreenElement) &&
            (e.target.closest('iframe') || e.target.tagName === 'IFRAME')) {
          return;
        }
      }
      
      if (!e.target.closest('.custom-video-controls') && 
          !e.target.closest('.custom-control-button')) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      }
    };

    const preventContextMenu = (e) => {
      if (!root.contains(e.target)) return;
      if (document.fullscreenElement || document.webkitFullscreenElement || 
          document.mozFullScreenElement || document.msFullscreenElement) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    root.addEventListener('click', preventAllClicks, true);
    root.addEventListener('contextmenu', preventContextMenu, true);

    return () => {
      root.removeEventListener('click', preventAllClicks, true);
      root.removeEventListener('contextmenu', preventContextMenu, true);
    };
  }, [isMobile, hasAccess, playerReady]);

  // Player control functions
  const togglePlay = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pauseVideo();
      } else {
        playerRef.current.playVideo();
      }
    }
  };

  const handleSeek = (time) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume * 100);
      setVolume(newVolume);
    }
  };

  const handleVolumeUp = () => {
    const newVolume = Math.min(volume + 0.1, 1);
    handleVolumeChange(newVolume);
  };

  const handleVolumeDown = () => {
    const newVolume = Math.max(volume - 0.1, 0);
    handleVolumeChange(newVolume);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1));
  };

  const handleQualityChange = (quality) => {
    if (playerRef.current && playerRef.current.setPlaybackQuality) {
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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        className="custom-video-player relative bg-black rounded-lg overflow-hidden aspect-video w-full"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          position: 'relative',
        }}
        onMouseEnter={() => !isMobile && setShowControls(true)}
        onMouseLeave={() => !isMobile && setShowControls(false)}
        onTouchStart={() => isMobile && setShowControls(true)}
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

        {/* Video display area with zoom - YouTube iframe is inside containerRef */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        />

        {/* Blocking overlays - prevent clicks on YouTube UI */}
        {/* Top-left - blocks video title/link */}
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
          style={{
            background: 'transparent',
            cursor: 'not-allowed',
            zIndex: 15,
          }}
          aria-hidden="true"
        />

        {/* Top-right - blocks "Copy link" button */}
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
          style={{
            background: 'transparent',
            cursor: 'not-allowed',
            zIndex: 15,
          }}
          aria-hidden="true"
        />

        {/* Bottom - blocks YouTube logo and "Watch on YouTube" */}
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

        {/* Custom Controls Overlay */}
        {playerReady && (
          <div 
            className={`custom-video-controls absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent ${isMobile ? 'p-3' : 'p-4'} transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
            onMouseEnter={() => !isMobile && setShowControls(true)}
            onMouseLeave={() => !isMobile && setShowControls(false)}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (isMobile) setShowControls(true);
            }}
          >
            {/* Progress bar */}
            <div className={`mb-3 ${isMobile ? 'mb-4' : ''}`}>
              <div 
                className={`relative ${isMobile ? 'h-3' : 'h-1'} bg-white/20 rounded-full cursor-pointer touch-none`}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
                onTouchEnd={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const touch = e.changedTouches[0];
                  const percent = (touch.clientX - rect.left) / rect.width;
                  handleSeek(percent * duration);
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            </div>

            <div className={`flex items-center justify-center ${isMobile ? 'flex-wrap gap-3 px-2' : 'space-x-6'} text-white`}>
              {/* Play/Pause Button */}
              <button
                onClick={togglePlay}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  togglePlay();
                }}
                className={`custom-control-button ${isMobile ? 'p-3' : 'p-2'} hover:bg-white/20 active:bg-white/30 rounded transition-colors text-red-600 touch-manipulation`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Volume Controls */}
              <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-2'}`}>
                <button
                  onClick={handleVolumeDown}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleVolumeDown();
                  }}
                  className={`custom-control-button ${isMobile ? 'p-3' : 'p-2'} hover:bg-white/20 active:bg-white/30 rounded transition-colors text-red-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation`}
                  aria-label="Volume Down"
                  disabled={volume <= 0}
                >
                  <svg className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                  </svg>
                </button>

                <span className={`${isMobile ? 'text-base font-bold px-3' : 'text-sm font-bold px-2'} text-red-600 font-mono min-w-[40px] text-center`}>
                  {Math.round(volume * 100)}%
                </span>

                <button
                  onClick={handleVolumeUp}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleVolumeUp();
                  }}
                  className={`custom-control-button ${isMobile ? 'p-3' : 'p-2'} hover:bg-white/20 active:bg-white/30 rounded transition-colors text-red-600 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation`}
                  aria-label="Volume Up"
                  disabled={volume >= 1}
                >
                  <svg className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                  </svg>
                </button>
              </div>

              {/* Quality Selector */}
              {availableQualities.length > 0 && (
                <div className="relative">
                  <button
                    className="custom-control-button p-2 hover:bg-white/20 rounded transition-colors"
                    aria-label="Quality"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" />
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
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleFullscreen();
                }}
                className={`custom-control-button ${isMobile ? 'p-3' : 'p-2'} hover:bg-red-900/30 active:bg-red-900/50 rounded transition-colors text-red-600 touch-manipulation`}
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className={`${isMobile ? 'w-7 h-7' : 'w-5 h-5'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Time display */}
            <div className={`text-center text-red-600 font-bold ${isMobile ? 'text-base mt-3' : 'text-sm mt-2'} drop-shadow-lg`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
        )}

        {/* Play/Pause Button in Left Corner */}
        {playerReady && (
          <button
            onClick={togglePlay}
            onTouchEnd={(e) => {
              e.preventDefault();
              togglePlay();
            }}
            className={`absolute ${isMobile ? 'top-3 left-3' : 'top-4 left-4'} z-30 custom-control-button bg-black/70 hover:bg-black/90 active:bg-black/95 rounded-full ${isMobile ? 'p-4' : 'p-3'} transition-colors shadow-lg touch-manipulation`}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-red-600`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-red-600 ml-1`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* CSS - Hide all YouTube UI but keep video visible */}
      <style dangerouslySetInnerHTML={{__html: `
        /* YouTube iframe is visible but all UI is hidden */
        .custom-video-player iframe {
          pointer-events: none !important; /* Block all clicks on iframe */
        }

        /* Allow iframe interactions in fullscreen mode */
        .custom-video-player:fullscreen iframe,
        .custom-video-player:-webkit-full-screen iframe,
        .custom-video-player:-moz-full-screen iframe,
        .custom-video-player:-ms-fullscreen iframe {
          pointer-events: auto !important; /* Enable clicks in fullscreen */
        }

        /* Hide ALL YouTube UI elements */
        .custom-video-player .ytp-watermark,
        .custom-video-player .ytp-watermark-logo,
        .custom-video-player .ytp-branding-logo,
        .custom-video-player .ytp-share-button,
        .custom-video-player .ytp-title-link,
        .custom-video-player .ytp-show-cards-title,
        .custom-video-player .ytp-copylink-button,
        .custom-video-player .ytp-chrome-top,
        .custom-video-player .ytp-chrome-bottom,
        .custom-video-player .ytp-title,
        .custom-video-player .ytp-title-text,
        .custom-video-player .ytp-title-content,
        .custom-video-player button[aria-label*="Copy"],
        .custom-video-player button[title*="Copy"],
        .custom-video-player a[href*="youtube.com"],
        .custom-video-player a[href*="youtu.be"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }

        /* Remove all shadows */
        .custom-video-player iframe,
        .custom-video-player > div {
          background: transparent !important;
          box-shadow: none !important;
        }

        /* Custom controls styling */
        .custom-video-controls {
          pointer-events: auto !important;
        }

        .custom-control-button {
          pointer-events: auto !important;
        }

        /* Enable iframe interactions in fullscreen mode */
        .custom-video-player:fullscreen iframe,
        .custom-video-player:-webkit-full-screen iframe,
        .custom-video-player:-moz-full-screen iframe,
        .custom-video-player:-ms-fullscreen iframe {
          pointer-events: auto !important;
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
          .custom-video-player {
            border-radius: 0.5rem;
          }
          
          /* Larger touch targets for mobile */
          .custom-control-button {
            min-width: 44px;
            min-height: 44px;
            -webkit-tap-highlight-color: rgba(255, 0, 0, 0.3);
          }
          
          /* Make controls more visible on mobile */
          .custom-video-controls {
            padding: 1rem !important;
          }
          
          /* Prevent text selection on mobile */
          .custom-video-player * {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
            -webkit-touch-callout: none;
          }
        }
        
        /* Touch optimizations */
        .touch-manipulation {
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }
      `}} />
    </>
  );
};

export default CustomYouTubePlayer;
