'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Custom HTML5 Video Player (NO YouTube)
 * 
 * Features:
 * - Custom HTML5 video player (not YouTube iframe)
 * - Zoom in/out functionality
 * - Video quality selection (if multiple sources provided)
 * - Fullscreen support
 * - Clean custom controls
 * - No YouTube branding or links
 */
const CustomHTML5VideoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  
  // Custom controls state
  const [showControls, setShowControls] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [currentQuality, setCurrentQuality] = useState('high');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Get video source URL (direct video file, not YouTube)
  const getVideoSource = () => {
    // Priority: direct video URL > videoData URL > videoPath
    if (video?.directVideoUrl) {
      return video.directVideoUrl;
    }
    if (video?.videoData?.url && !video.videoData.isDataUrl) {
      return video.videoData.url;
    }
    if (video?.videoPath) {
      return video.videoPath;
    }
    return null;
  };

  // Get multiple quality sources if available
  const getVideoSources = () => {
    const sources = [];
    
    // High quality
    if (video?.videoSources?.high) {
      sources.push({ src: video.videoSources.high, quality: 'high', label: 'HD (1080p)' });
    }
    if (video?.videoSources?.medium) {
      sources.push({ src: video.videoSources.medium, quality: 'medium', label: 'HD (720p)' });
    }
    if (video?.videoSources?.low) {
      sources.push({ src: video.videoSources.low, quality: 'low', label: 'SD (480p)' });
    }
    
    // Fallback to single source
    if (sources.length === 0) {
      const singleSource = getVideoSource();
      if (singleSource) {
        sources.push({ src: singleSource, quality: 'auto', label: 'Auto' });
      }
    }
    
    return sources;
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

  // Initialize video player
  useEffect(() => {
    if (!hasAccess || !videoRef.current) return;

    const videoElement = videoRef.current;
    const sources = getVideoSources();
    
    if (sources.length === 0) {
      setError('No video source available');
      setIsLoading(false);
      return;
    }

    // Set initial source based on current quality
    const currentSource = sources.find(s => s.quality === currentQuality) || sources[0];
    videoElement.src = currentSource.src;

    // Video event handlers
    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      setPlayerReady(true);
      setIsLoading(false);
      if (onVideoStart) onVideoStart(video);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onVideoEnd) onVideoEnd(video);
    };

    const handleVolumeChange = () => {
      setVolume(videoElement.volume);
    };

    const handleRateChange = () => {
      setPlaybackRate(videoElement.playbackRate);
    };

    // Add event listeners
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('volumechange', handleVolumeChange);
    videoElement.addEventListener('ratechange', handleRateChange);

    // Cleanup
    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('volumechange', handleVolumeChange);
      videoElement.removeEventListener('ratechange', handleRateChange);
    };
  }, [hasAccess, video, currentQuality, onVideoStart, onVideoEnd]);

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

  // Prevent right-click and other security measures
  useEffect(() => {
    const preventContextMenu = (e) => {
      if (e.target.closest('.custom-video-player')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    const preventDrag = (e) => {
      if (e.target.closest('.custom-video-player')) {
        e.preventDefault();
        return false;
      }
    };

    const preventSelection = (e) => {
      if (e.target.closest('.custom-video-player')) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', preventContextMenu, true);
    document.addEventListener('dragstart', preventDrag, true);
    document.addEventListener('selectstart', preventSelection, true);

    return () => {
      document.removeEventListener('contextmenu', preventContextMenu, true);
      document.removeEventListener('dragstart', preventDrag, true);
      document.removeEventListener('selectstart', preventSelection, true);
    };
  }, []);

  // Player control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2)); // Max 2x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1)); // Min 1x zoom
  };

  const handleQualityChange = (quality) => {
    if (videoRef.current) {
      const sources = getVideoSources();
      const selectedSource = sources.find(s => s.quality === quality);
      if (selectedSource) {
        const currentTime = videoRef.current.currentTime;
        const wasPlaying = !videoRef.current.paused;
        videoRef.current.src = selectedSource.src;
        videoRef.current.load();
        videoRef.current.currentTime = currentTime;
        if (wasPlaying) {
          videoRef.current.play();
        }
        setCurrentQuality(quality);
      }
    }
  };

  const handleVolumeUp = () => {
    if (videoRef.current) {
      const newVolume = Math.min(volume + 0.1, 1);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleVolumeDown = () => {
    if (videoRef.current) {
      const newVolume = Math.max(volume - 0.1, 0);
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handleSpeedUp = () => {
    if (videoRef.current) {
      const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      // Find closest speed or next higher
      let currentIndex = speeds.findIndex(s => s >= playbackRate);
      if (currentIndex === -1) currentIndex = speeds.length - 1;
      const nextIndex = Math.min(currentIndex + 1, speeds.length - 1);
      const newSpeed = speeds[nextIndex];
      videoRef.current.playbackRate = newSpeed;
      setPlaybackRate(newSpeed);
    }
  };

  const handleSpeedDown = () => {
    if (videoRef.current) {
      const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
      // Find closest speed or next lower
      let currentIndex = speeds.findIndex(s => s > playbackRate) - 1;
      if (currentIndex < 0) currentIndex = 0;
      const nextIndex = Math.max(currentIndex - 1, 0);
      const newSpeed = speeds[nextIndex];
      videoRef.current.playbackRate = newSpeed;
      setPlaybackRate(newSpeed);
    }
  };

  const handleQualityIncrease = () => {
    const sources = getVideoSources();
    if (sources.length <= 1) return;
    
    const qualityOrder = ['low', 'medium', 'high', 'auto'];
    const currentIndex = qualityOrder.indexOf(currentQuality);
    if (currentIndex < qualityOrder.length - 1) {
      const nextQuality = qualityOrder[currentIndex + 1];
      const nextSource = sources.find(s => s.quality === nextQuality);
      if (nextSource) {
        handleQualityChange(nextQuality);
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

  const sources = getVideoSources();

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

  if (sources.length === 0 && hasAccess) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="text-center text-white p-6">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Video Not Available</h3>
          <p className="text-gray-400">No direct video source configured. Please provide a direct video URL (not YouTube).</p>
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

      {/* Video element with zoom */}
      <div
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
          width: '100%',
          height: '100%',
        }}
      >
        <video
          ref={videoRef}
          className="w-full h-full"
          playsInline
          controls={false}
          onContextMenu={(e) => {
            e.preventDefault();
            return false;
          }}
          style={{
            objectFit: 'contain',
          }}
        >
          {sources.map((source, index) => (
            <source key={index} src={source.src} type="video/mp4" />
          ))}
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Custom Controls Overlay - Only Progress Bar */}
      {playerReady && (
        <div 
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          {/* Progress bar */}
          <div className="mb-2">
            <div 
              className="relative h-2 bg-white/30 rounded-full cursor-pointer" 
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                handleSeek(percent * duration);
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-red-600 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Center play button (when paused) */}
      {!isPlaying && playerReady && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-label="Play"
        >
          <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-12 h-12 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
    </div>

    {/* Video Controls - Outside Video Container */}
    {playerReady && (
      <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600">
        <div className="flex items-center justify-center flex-wrap gap-4">
            {/* Play/Pause Button */}
            <div className="bg-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-lg">
              <button
                onClick={togglePlay}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Volume Controls */}
            <div className="flex items-center space-x-2 bg-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-lg">
              <button
                onClick={handleVolumeDown}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Volume Down"
                disabled={volume <= 0}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" />
                </svg>
              </button>

              <span className="text-sm font-bold px-3 py-1 bg-white text-black rounded min-w-[50px] text-center font-mono">
                {Math.round(volume * 100)}%
              </span>

              <button
                onClick={handleVolumeUp}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Volume Up"
                disabled={volume >= 1}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
            </div>

            {/* Speed Controls */}
            <div className="flex items-center space-x-2 bg-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-lg">
              <button
                onClick={handleSpeedDown}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Speed Down"
                disabled={playbackRate <= 0.25}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M15.5 5H14v14h1.5V5zM11 5H9.5v14H11V5zM7 5H5.5v14H7V5z" />
                </svg>
              </button>

              <span className="text-sm font-bold px-3 py-1 bg-white text-black rounded min-w-[45px] text-center font-mono">
                {playbackRate}x
              </span>

              <button
                onClick={handleSpeedUp}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Speed Up"
                disabled={playbackRate >= 2}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path d="M13 5h-2v14h2V5zm4 0h-2v14h2V5zM9 5H7v14h2V5z" />
                </svg>
              </button>
            </div>

            {/* Quality Increase Button */}
            {sources.length > 1 && (
              <div className="bg-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-lg">
                <button
                  onClick={handleQualityIncrease}
                  className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black"
                  aria-label="Increase Quality"
                  title={`Current: ${sources.find(s => s.quality === currentQuality)?.label || currentQuality}`}
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M7.5 12.5l4.5 4.5 4.5-4.5H19V5H5v7.5h2.5zm8.5 0V7h2.5v5.5H16zm-9 0V7h2.5v5.5H7z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Fullscreen */}
            <div className="bg-black px-4 py-3 rounded-lg border-2 border-gray-400 shadow-lg">
              <button
                onClick={handleFullscreen}
                className="p-2 bg-white hover:bg-gray-200 rounded transition-colors text-black"
                aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Time display */}
          <div className="text-center text-gray-700 dark:text-gray-300 text-sm mt-3 font-semibold">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      )}
    </>
  );
};

export default CustomHTML5VideoPlayer;

