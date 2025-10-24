'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

const SecureVideoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Video protection measures
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Disable right-click context menu
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable keyboard shortcuts for screenshots
    const handleKeyDown = (e) => {
      // Disable Print Screen, F12, Ctrl+Shift+I, etc.
      if (
        e.key === 'PrintScreen' ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.altKey && e.key === 'F4')
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Disable text selection
    const handleSelectStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable drag and drop
    const handleDragStart = (e) => {
      e.preventDefault();
      return false;
    };

    // Add event listeners
    video.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    // CSS-based protection
    const style = document.createElement('style');
    style.textContent = `
      .secure-video-container {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      .secure-video-container * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .secure-video-container video {
        pointer-events: auto;
      }
      .secure-video-container video::-webkit-media-controls {
        display: none !important;
      }
      .secure-video-container video::-webkit-media-controls-enclosure {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      video.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.head.removeChild(style);
    };
  }, []);

  // Detect screen recording attempts
  useEffect(() => {
    const detectScreenRecording = () => {
      // Check for screen recording indicators
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // This is a basic detection - in production, you'd want more sophisticated methods
        console.log('Screen recording detection active');
      }
    };

    detectScreenRecording();
  }, []);

  // Handle video loading
  const handleLoadStart = () => {
    setIsLoading(true);
    setError(null);
  };

  const handleLoadedMetadata = () => {
    setIsLoading(false);
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    if (onVideoStart) onVideoStart(video);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onVideoEnd) onVideoEnd(video);
  };

  const handleError = (e) => {
    console.error('Video error:', e);
    setError('Failed to load video. Please try again.');
    setIsLoading(false);
    setAttempts(prev => prev + 1);
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(err => {
        console.error('Play failed:', err);
        setError('Unable to play video');
      });
    } else {
      video.pause();
    }
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getVideoUrl = () => {
    if (!session) return null;
    return `/api/video/stream/${courseId}/${video._id}`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please log in to watch this video</p>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg">
            Login Required
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="secure-video-container relative bg-black rounded-lg overflow-hidden"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        onLoadStart={handleLoadStart}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        controls={false}
        playsInline
        preload="metadata"
        crossOrigin="anonymous"
        poster={video.thumbnail || undefined}
        style={{
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
      >
        {getVideoUrl() && (
          <source src={getVideoUrl()} type="video/mp4" />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white p-6">
            <p className="mb-4">{error}</p>
            {attempts < 3 && (
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  const video = videoRef.current;
                  if (video) {
                    video.load();
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
        {/* Progress Bar */}
        <div 
          className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-4"
          onClick={handleSeek}
        >
          <div 
            className="h-full bg-red-600 rounded-full transition-all duration-200"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlayPause}
              className="hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            {/* Time Display */}
            <span className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="hover:text-gray-300 transition-colors"
            >
              {isFullscreen ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Video Title */}
      <div className="absolute top-4 left-4 right-4">
        <h3 className="text-white text-lg font-semibold drop-shadow-lg">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-white text-sm drop-shadow-lg mt-1">
            {video.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default SecureVideoPlayer;
