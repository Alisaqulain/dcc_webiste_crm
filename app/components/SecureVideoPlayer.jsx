'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const SecureVideoPlayer = ({ courseId, video, onVideoEnd, onVideoStart }) => {
  const { data: session } = useSession();
  const router = useRouter();
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
  const [isBuffering, setIsBuffering] = useState(false);
  const playPromiseRef = useRef(null);

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
    style.id = 'secure-video-styles';
    style.textContent = `
      .secure-video-container {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
        position: relative;
        overflow: hidden;
      }
      .secure-video-container * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
      .secure-video-container video {
        pointer-events: auto;
        -webkit-user-drag: none;
        -khtml-user-drag: none;
        -moz-user-drag: none;
        -o-user-drag: none;
        user-drag: none;
      }
      .secure-video-container video::-webkit-media-controls {
        display: none !important;
      }
      .secure-video-container video::-webkit-media-controls-enclosure {
        display: none !important;
      }
      /* Prevent screenshots with CSS */
      .secure-video-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10000;
        pointer-events: none;
        background: transparent;
      }
      /* Disable video download */
      video {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
      }
    `;
    if (!document.getElementById('secure-video-styles')) {
      document.head.appendChild(style);
    }

    return () => {
      video.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.head.removeChild(style);
    };
  }, []);

  // Cleanup play promises on unmount
  useEffect(() => {
    return () => {
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
        playPromiseRef.current = null;
      }
    };
  }, []);

  // Handle video source changes
  useEffect(() => {
    const videoElement = videoRef.current;
    const isPreview = video?.isPreview === true;
    
    // Allow preview videos without session, but require session for non-preview videos
    if (!videoElement || !video?._id || (!session && !isPreview)) {
      console.warn('Cannot load video:', { 
        hasElement: !!videoElement, 
        videoId: video?._id, 
        hasSession: !!session,
        isPreview 
      });
      return;
    }

    // Reset states when video changes
    setIsLoading(true);
    setError(null);
    setIsBuffering(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAttempts(0);
    
    const videoUrl = getVideoUrl();
    if (!videoUrl) {
      console.error('No video URL available');
      setError('Video URL not available. Please refresh the page.');
      setIsLoading(false);
      return;
    }
    
    console.log('Loading video:', { courseId, videoId: video._id, videoUrl });
    
    // Cancel any pending play promise
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }

    // Reload video when source changes
    const handleSourceChange = () => {
      if (videoElement) {
        // Check if source is already set
        const sourceElement = videoElement.querySelector('source');
        console.log('Checking source element:', {
          hasSourceElement: !!sourceElement,
          sourceSrc: sourceElement?.src,
          expectedUrl: videoUrl,
          videoElementSrc: videoElement.src,
          videoElementCurrentSrc: videoElement.currentSrc,
          networkState: videoElement.networkState,
          readyState: videoElement.readyState
        });
        
        // If source exists but src doesn't match, update it
        if (sourceElement) {
          if (sourceElement.src !== videoUrl && videoUrl) {
            console.log('Updating source src from', sourceElement.src, 'to', videoUrl);
            sourceElement.src = videoUrl;
          }
        } else {
          // Source element doesn't exist, create it
          if (videoUrl) {
            console.log('Creating source element with URL:', videoUrl);
            const newSource = document.createElement('source');
            newSource.src = videoUrl;
            newSource.type = 'video/mp4';
            videoElement.appendChild(newSource);
          }
        }
        
        // Always load to ensure video picks up the source
        console.log('Loading video with source:', videoElement.querySelector('source')?.src || 'no source');
        videoElement.load();
      }
    };

    // Small delay to ensure source is set in DOM
    const timeout = setTimeout(handleSourceChange, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [video?._id, courseId, session, video?.isPreview]);

  // Detect screen recording and screenshot attempts
  useEffect(() => {
    // Detect screen recording attempts
    const detectScreenRecording = () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getDisplayMedia = async (constraints) => {
          console.warn('Screen recording attempt detected');
          // You can add logic to pause video or show warning
          alert('Screen recording is not allowed while watching this video.');
          throw new Error('Screen recording not allowed');
        };
      }
    };

    // Detect screenshot attempts (Windows)
    const detectScreenshot = (e) => {
      // Detect Print Screen key
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'PrintScreen')) {
        e.preventDefault();
        e.stopPropagation();
        alert('Screenshots are not allowed while watching this video.');
        return false;
      }
      
      // Detect Win + Shift + S (Windows Snipping Tool)
      if (e.key === 's' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        e.stopPropagation();
        alert('Screenshots are not allowed while watching this video.');
        return false;
      }
    };

    // Detect right-click context menu
    const preventContextMenu = (e) => {
      e.preventDefault();
      alert('Right-click is disabled for video protection.');
      return false;
    };

    // Detect common screenshot shortcuts
    const preventScreenshot = (e) => {
      // Ctrl+Shift+S, Win+Shift+S, etc.
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        e.stopPropagation();
        alert('Screenshots are not allowed.');
        return false;
      }
      
      // Print Screen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        alert('Screenshots are not allowed.');
        return false;
      }
    };

    // Add watermarks/overlay to prevent screenshots
    const addProtectionOverlay = () => {
      const overlay = document.createElement('div');
      overlay.id = 'video-protection-overlay';
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 9999;
        background: transparent;
        user-select: none;
      `;
      
      // Add watermark with user info
      const watermark = document.createElement('div');
      watermark.textContent = session?.user?.email || 'Protected Content';
      watermark.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        pointer-events: none;
        user-select: none;
      `;
      overlay.appendChild(watermark);
      
      const container = containerRef.current;
      if (container) {
        container.style.position = 'relative';
        container.appendChild(overlay);
      }
      
      return () => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      };
    };

    detectScreenRecording();
    
    // Add event listeners
    document.addEventListener('keydown', preventScreenshot);
    document.addEventListener('keydown', detectScreenshot);
    document.addEventListener('contextmenu', preventContextMenu);
    
    const removeOverlay = addProtectionOverlay();

    // Detect if video element is being copied/saved
    const video = videoRef.current;
    if (video) {
      video.addEventListener('copy', (e) => {
        e.preventDefault();
        alert('Copying video content is not allowed.');
      });
      
      video.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });
    }

    return () => {
      document.removeEventListener('keydown', preventScreenshot);
      document.removeEventListener('keydown', detectScreenshot);
      document.removeEventListener('contextmenu', preventContextMenu);
      if (removeOverlay) removeOverlay();
    };
  }, [session]);

  // Handle video loading
  const handleLoadStart = () => {
    const videoElement = videoRef.current;
    setIsLoading(true);
    setError(null);
    setIsBuffering(false);
    
    if (videoElement) {
      const videoUrl = getVideoUrl();
      console.log('Video load started:', {
        videoId: video?._id,
        videoUrl,
        src: videoElement.src,
        currentSrc: videoElement.currentSrc
      });
    }
  };

  const handleLoadedMetadata = () => {
    setIsLoading(false);
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    setIsBuffering(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setIsBuffering(false);
  };

  const handleCanPlayThrough = () => {
    setIsLoading(false);
    setIsBuffering(false);
    
    const videoElement = videoRef.current;
    if (videoElement) {
      console.log('Video can play through:', {
        duration: videoElement.duration,
        readyState: videoElement.readyState,
        networkState: videoElement.networkState,
        buffered: videoElement.buffered.length > 0 ? {
          ranges: videoElement.buffered.length,
          start: videoElement.buffered.start(0),
          end: videoElement.buffered.end(videoElement.buffered.length - 1)
        } : null
      });
    }
  };

  const handleWaiting = () => {
    // Only show buffering if we don't have enough data ahead
    const videoElement = videoRef.current;
    if (videoElement && videoElement.buffered.length > 0) {
      const currentTime = videoElement.currentTime;
      const lastBufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
      const timeAhead = lastBufferedEnd - currentTime;
      
      // Only show buffering if we have less than 1 second ahead
      // Reduced threshold significantly to prevent premature buffering indication
      // This allows video to continue playing while loading more data
      if (timeAhead < 1) {
        setIsBuffering(true);
      }
    } else {
      // Only show buffering if video is actually waiting
      if (videoElement && videoElement.readyState < 3) {
        setIsBuffering(true);
      }
    }
  };

  const handleProgress = () => {
    const videoElement = videoRef.current;
    if (!videoElement || videoElement.paused) return;
    
    const buffered = videoElement.buffered;
    const duration = videoElement.duration;
    const currentTime = videoElement.currentTime;
    
    if (buffered.length > 0 && duration > 0 && currentTime > 0) {
      const lastBufferedEnd = buffered.end(buffered.length - 1);
      const timeAheadBuffered = lastBufferedEnd - currentTime;
      
      // Only show buffering if we have less than 2 seconds buffered ahead
      // Reduced threshold to prevent constant buffering state while video is loading
      // Browser will automatically request more data when buffer is low
      if (timeAheadBuffered < 2 && timeAheadBuffered > 0) {
        // Less than 2 seconds buffered ahead - we're running low
        setIsBuffering(true);
      } else if (timeAheadBuffered >= 2) {
        // We have enough buffer ahead (at least 2 seconds)
        setIsBuffering(false);
      }
      
      // Browser will automatically request more data when buffer is low
      // No need to manually trigger loading - let browser handle it
    }
  };

  const handlePlaying = () => {
    setIsBuffering(false);
    setIsPlaying(true);
  };

  const handleStalled = () => {
    setIsBuffering(true);
  };

  const handleSuspend = () => {
    // Video loading was suspended, but don't show error
    setIsBuffering(true);
  };

  const handleSeeking = () => {
    // Video is seeking to a new position
    setIsBuffering(true);
  };

  const handleSeeked = () => {
    // Video finished seeking
    setIsBuffering(false);
    const video = videoRef.current;
    if (video) {
      setCurrentTime(video.currentTime);
      // If video was playing before seek, ensure it continues
      if (!video.paused && playPromiseRef.current === null) {
        video.play().catch(() => {
          // Ignore errors, video might already be playing
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video) {
      const time = video.currentTime;
      setCurrentTime(time);
      
      // Less aggressive buffering detection
      // Only show buffering if we actually don't have enough data
      if (!video.paused && video.buffered.length > 0) {
        const lastBufferedEnd = video.buffered.end(video.buffered.length - 1);
        const timeAheadBuffered = lastBufferedEnd - time;
        
        // Only show buffering if we have less than 1 second ahead
        // Reduced threshold to prevent premature buffering indication
        if (timeAheadBuffered < 1 && timeAheadBuffered > 0) {
          setIsBuffering(true);
        } else if (timeAheadBuffered >= 2) {
          // We have at least 2 seconds buffered - clear buffering state
          setIsBuffering(false);
        }
      } else if (video.readyState >= 3 && !video.paused) {
        // If we have enough data (readyState >= 3 means HAVE_FUTURE_DATA or better), don't show buffering
        setIsBuffering(false);
      }
    }
  };

  const handlePlay = () => {
    const videoElement = videoRef.current;
    setIsPlaying(true);
    setIsBuffering(false);
    
    if (videoElement) {
      console.log('Video playing:', {
        currentTime: videoElement.currentTime,
        duration: videoElement.duration,
        readyState: videoElement.readyState,
        networkState: videoElement.networkState,
        src: videoElement.currentSrc || videoElement.src
      });
    }
    
    if (onVideoStart) onVideoStart(video);
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Cancel any pending play promise
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setIsBuffering(false);
    if (playPromiseRef.current) {
      playPromiseRef.current.catch(() => {});
      playPromiseRef.current = null;
    }
    if (onVideoEnd) onVideoEnd(video);
  };

  const handleError = async (e) => {
    const videoElement = videoRef.current;
    let errorDetails = 'Failed to load video. Please try again.';
    
    if (videoElement) {
      const errorCode = videoElement.error;
      const networkStateMap = {
        0: 'NETWORK_EMPTY',
        1: 'NETWORK_IDLE',
        2: 'NETWORK_LOADING',
        3: 'NETWORK_NO_SOURCE'
      };
      
      const readyStateMap = {
        0: 'HAVE_NOTHING',
        1: 'HAVE_METADATA',
        2: 'HAVE_CURRENT_DATA',
        3: 'HAVE_FUTURE_DATA',
        4: 'HAVE_ENOUGH_DATA'
      };
      
      if (errorCode) {
        switch (errorCode.code) {
          case 1: // MEDIA_ERR_ABORTED
            errorDetails = 'Video loading was aborted. Please try again.';
            break;
          case 2: // MEDIA_ERR_NETWORK
            errorDetails = 'Network error. Please check your connection and try again.';
            break;
          case 3: // MEDIA_ERR_DECODE
            // Check if we're near the end of the video - might be incomplete last chunk
            const currentTime = videoElement.currentTime ?? 0;
            const videoDuration = videoElement.duration ?? 0;
            const timeRemaining = videoDuration > 0 ? videoDuration - currentTime : Infinity;
            
            // Treat as "near end" if within last 10 seconds (user reports last 10 seconds not working)
            // Only if duration is valid and we've played some of the video
            if (videoDuration > 10 && currentTime > 0 && timeRemaining <= 10) {
              // Near end of video - might be last chunk issue, try to recover
              console.warn('Decode error in last portion of video:', {
                currentTime,
                duration: videoDuration,
                timeRemaining,
                readyState: videoElement.readyState,
                networkState: videoElement.networkState,
                buffered: videoElement.buffered.length > 0 ? {
                  start: videoElement.buffered.start(0),
                  end: videoElement.buffered.end(videoElement.buffered.length - 1)
                } : null
              });
              
              // If very close (within 1 second), treat as completed
              if (timeRemaining <= 1) {
                console.log('Very close to end, treating as completed');
                setIsPlaying(false);
                setIsBuffering(false);
                setCurrentTime(videoDuration);
                if (onVideoEnd) {
                  onVideoEnd(video);
                }
                return;
              }
              
              // Try to reload and seek to current position to recover
              const wasPlaying = !videoElement.paused;
              const seekTime = Math.max(0, currentTime - 1); // Seek back 1 second
              
              setTimeout(() => {
                if (videoElement && videoElement.networkState === 3) {
                  console.log('Reloading video to recover from decode error');
                  videoElement.load();
                  
                  // Try to resume after reload
                  videoElement.addEventListener('canplay', function resumeAfterReload() {
                    videoElement.removeEventListener('canplay', resumeAfterReload);
                    if (videoElement && seekTime < videoElement.duration) {
                      videoElement.currentTime = seekTime;
                      if (wasPlaying) {
                        videoElement.play().catch(() => {});
                      }
                    }
                  }, { once: true });
                }
              }, 500);
              
              // Show a less alarming error message
              errorDetails = 'Video encountered a minor issue near the end. Attempting to recover...';
            } else {
              errorDetails = 'Video format error. Please contact support.';
              console.error('Decode error (not near end):', {
                currentTime,
                duration: videoDuration,
                timeRemaining: videoDuration > 0 ? timeRemaining : 'unknown',
                readyState: videoElement.readyState,
                networkState: videoElement.networkState,
                errorCode: errorCode?.code,
                errorMessage: errorCode?.message
              });
            }
            break;
          case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
            errorDetails = 'Video format not supported or source not found.';
            break;
          default:
            errorDetails = `Video error (code: ${errorCode.code}). Please try again.`;
        }
      } else {
        // Error code is null, check network state
        if (videoElement.networkState === 3) {
          errorDetails = 'Network error: Unable to load video source. Please check your connection.';
          
          // Try to fix source if missing
          const videoUrl = getVideoUrl();
          const sourceElement = videoElement.querySelector('source');
          if (videoUrl && (!sourceElement || !sourceElement.src)) {
            console.log('Attempting to fix video source after network error');
            // Source might be missing, reload video
            setTimeout(() => {
              if (videoElement) {
                videoElement.load();
              }
            }, 1000);
          }
        } else if (videoElement.readyState === 0) {
          errorDetails = 'Video failed to load. Please try again.';
          
          // Try to reload if not loaded
          if (attempts < 3) {
            console.log(`Retrying video load (attempt ${attempts + 1}/3)`);
            setTimeout(() => {
              if (videoElement) {
                // Force reload by clearing and setting source again
                const videoUrl = getVideoUrl();
                if (videoUrl) {
                  const sourceElement = videoElement.querySelector('source');
                  if (sourceElement) {
                    sourceElement.src = videoUrl;
                  } else {
                    // Create new source element
                    const newSource = document.createElement('source');
                    newSource.src = videoUrl;
                    newSource.type = 'video/mp4';
                    videoElement.appendChild(newSource);
                  }
                  videoElement.load();
                }
              }
            }, 2000 * (attempts + 1)); // Exponential backoff
          } else {
            errorDetails = 'Video failed to load after multiple attempts. Please refresh the page.';
          }
        }
      }
      
      // Capture comprehensive error information
      try {
        // Get video URL before any potential errors
        const videoUrl = getVideoUrl();
        
        // Check for network errors by testing the URL (non-blocking)
        let networkTest = null;
        if (videoUrl) {
          // Test network access asynchronously without blocking error logging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          fetch(videoUrl, { 
            method: 'HEAD', 
            signal: controller.signal,
            credentials: 'include', // Include cookies for authentication
            cache: 'no-store',
            headers: {
              'Range': 'bytes=0-1023' // Request first 1KB to test
            }
          })
            .then(testResponse => {
              clearTimeout(timeoutId);
              networkTest = {
                status: testResponse.status,
                statusText: testResponse.statusText,
                ok: testResponse.ok,
                headers: {
                  'content-type': testResponse.headers.get('content-type'),
                  'content-length': testResponse.headers.get('content-length'),
                  'accept-ranges': testResponse.headers.get('accept-ranges'),
                  'content-range': testResponse.headers.get('content-range')
                }
              };
              console.log('Network test result:', networkTest);
              
              if (!testResponse.ok) {
                console.error('Network test failed with status:', testResponse.status);
                // If 401, session might be expired
                if (testResponse.status === 401) {
                  console.error('Authentication failed - session may be expired');
                  errorDetails = 'Session expired. Please refresh the page and log in again.';
                } else if (testResponse.status === 403) {
                  console.error('Access denied - user may not have purchased the course');
                  errorDetails = 'Access denied. Please purchase this course to watch videos.';
                } else if (testResponse.status === 404) {
                  console.error('Video file not found on server');
                  errorDetails = 'Video file not found on server. Please contact support.';
                }
              }
            })
            .catch(fetchErr => {
              clearTimeout(timeoutId);
              networkTest = {
                error: fetchErr.message,
                type: fetchErr.name,
                accessible: false,
                aborted: fetchErr.name === 'AbortError'
              };
              console.error('Network test failed:', networkTest);
              
              // If it's not an abort error, there's a real network issue
              if (fetchErr.name !== 'AbortError') {
                errorDetails = `Network error: ${fetchErr.message}. Please check your connection.`;
              }
            });
        }
        
        const errorInfo = {
          error: e?.type || 'Unknown error',
          errorEvent: e ? {
            type: e.type || 'unknown',
            target: e.target?.tagName || 'unknown',
            timeStamp: e.timeStamp || Date.now(),
            detail: e.detail || null,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: e.defaultPrevented
          } : null,
          errorCode: errorCode ? {
            code: errorCode.code ?? null,
            message: errorCode.message || 'No error message',
            MEDIA_ERR_ABORTED: errorCode.code === 1,
            MEDIA_ERR_NETWORK: errorCode.code === 2,
            MEDIA_ERR_DECODE: errorCode.code === 3,
            MEDIA_ERR_SRC_NOT_SUPPORTED: errorCode.code === 4
          } : null,
          src: videoElement.src || 'No src attribute',
          currentSrc: videoElement.currentSrc || 'No current source',
          networkState: videoElement.networkState ?? null,
          networkStateText: networkStateMap[videoElement.networkState] || 'UNKNOWN',
          readyState: videoElement.readyState ?? null,
          readyStateText: readyStateMap[videoElement.readyState] || 'UNKNOWN',
          paused: videoElement.paused ?? null,
          ended: videoElement.ended ?? null,
          currentTime: videoElement.currentTime ?? null,
          duration: videoElement.duration ?? null,
          buffered: videoElement.buffered.length > 0 ? Array.from({ length: videoElement.buffered.length }, (_, i) => ({
            start: videoElement.buffered.start(i),
            end: videoElement.buffered.end(i)
          })) : [],
          videoUrl: videoUrl || 'No video URL',
          videoData: {
            title: video?.title,
            courseId,
            videoId: video?._id,
            videoPath: video?.videoPath,
            videoData: video?.videoData?.url || video?.videoData?.key
          },
          networkTest: networkTest,
          attempts,
          timestamp: new Date().toISOString()
        };
        
        console.error('Video error details:', JSON.stringify(errorInfo, null, 2));
        
        // Also log the raw error for debugging with more details
        if (e) {
          console.error('Raw error event:', {
            type: e.type,
            target: e.target,
            currentTarget: e.currentTarget,
            timeStamp: e.timeStamp,
            bubbles: e.bubbles,
            cancelable: e.cancelable,
            defaultPrevented: e.defaultPrevented,
            isTrusted: e.isTrusted,
            detail: e.detail,
            // Try to get all enumerable properties
            ...Object.keys(e).reduce((acc, key) => {
              try {
                acc[key] = e[key];
              } catch {
                acc[key] = '[Cannot access]';
              }
              return acc;
            }, {})
          });
        }
        if (errorCode) {
          console.error('Raw error code object:', {
            code: errorCode.code,
            message: errorCode.message,
            ...Object.keys(errorCode).reduce((acc, key) => {
              try {
                acc[key] = errorCode[key];
              } catch {
                acc[key] = '[Cannot access]';
              }
              return acc;
            }, {})
          });
        }
      } catch (err) {
        console.error('Error while logging video error:', err);
        console.error('Video element state:', {
          hasVideo: !!videoElement,
          networkState: videoElement?.networkState,
          readyState: videoElement?.readyState,
          error: videoElement?.error ? {
            code: videoElement.error.code,
            message: videoElement.error.message
          } : null,
          src: videoElement?.src,
          currentSrc: videoElement?.currentSrc,
          videoUrl: getVideoUrl()
        });
      }
    } else {
      console.error('Video error (no video element):', e);
    }
    
    setError(errorDetails);
    setIsLoading(false);
    setIsBuffering(false);
    setAttempts(prev => prev + 1);
  };

  const togglePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Cancel any pending play promise to avoid conflicts
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (err) {
        // Ignore interruption errors
      }
      playPromiseRef.current = null;
    }

    if (video.paused) {
      try {
        // Wait for video to be ready
        if (video.readyState < 2) {
          await new Promise((resolve) => {
            const handleCanPlay = () => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            };
            video.addEventListener('canplay', handleCanPlay);
            // Timeout after 10 seconds
            setTimeout(() => {
              video.removeEventListener('canplay', handleCanPlay);
              resolve();
            }, 10000);
          });
        }

        setIsBuffering(false);
        playPromiseRef.current = video.play();
        
        await playPromiseRef.current;
        playPromiseRef.current = null;
      } catch (err) {
        // Don't show error for play interruption - it's normal
        if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
          console.error('Play failed:', err);
          setError('Unable to play video. Please try again.');
        }
        playPromiseRef.current = null;
      }
    } else {
      video.pause();
      if (playPromiseRef.current) {
        playPromiseRef.current.catch(() => {});
        playPromiseRef.current = null;
      }
    }
  };

  const handleSeek = async (e) => {
    const video = videoRef.current;
    if (!video || !duration || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = Math.max(0, Math.min((clickX / width) * duration, duration));
    
    // Ensure we don't seek to invalid time
    if (isNaN(newTime) || !isFinite(newTime)) {
      console.warn('Invalid seek time:', newTime);
      return;
    }
    
    // Cancel any pending play promise before seeking
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (err) {
        // Ignore interruption errors
      }
      playPromiseRef.current = null;
    }

    const wasPlaying = !video.paused;
    
    try {
      // Set buffering state immediately
      setIsBuffering(true);
      
      // Wait for video to be ready before seeking
      if (video.readyState < 2) {
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          };
          video.addEventListener('canplay', handleCanPlay);
          setTimeout(() => {
            video.removeEventListener('canplay', handleCanPlay);
            resolve();
          }, 5000);
        });
      }

      // Perform the seek
      video.currentTime = newTime;
      setCurrentTime(newTime);
      
      // Wait a bit for the seek to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // If video was playing, resume playback after seek
      if (wasPlaying && video.paused) {
        try {
          playPromiseRef.current = video.play();
          await playPromiseRef.current;
          playPromiseRef.current = null;
        } catch (err) {
          // Ignore play errors during seek
          if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') {
            console.warn('Play after seek failed:', err);
          }
          playPromiseRef.current = null;
        }
      }
      
      // Clear buffering state after a delay (will be cleared by seeked event)
      setTimeout(() => {
        if (!video.paused && video.readyState >= 3) {
          setIsBuffering(false);
        }
      }, 500);
    } catch (err) {
      console.error('Seek error:', err);
      setIsBuffering(false);
      
      // Check if video source is still valid
      const videoUrl = getVideoUrl();
      const sourceElement = video.querySelector('source');
      
      // Reload video if source is missing or network state is bad
      if (video.networkState === 3 || !sourceElement || !sourceElement.src) {
        console.log('Reloading video after seek error');
        // Ensure source is set
        if (sourceElement) {
          sourceElement.src = videoUrl || '';
        }
        video.load();
      } else if (video.readyState < 2) {
        // Video not ready, wait and reload
        setTimeout(() => {
          video.load();
        }, 1000);
      }
    }
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
    // Check if video is a preview (free to watch)
    const isPreview = video?.isPreview === true;
    
    // For preview videos, session is not required
    // For paid videos, session is required
    if (!isPreview && !session) {
      console.warn('Cannot get video URL - session required for non-preview videos:', { 
        hasSession: !!session, 
        videoId: video?._id, 
        courseId,
        isPreview 
      });
      return null;
    }
    
    if (!video?._id || !courseId) {
      console.warn('Cannot get video URL - missing video ID or course ID:', { 
        hasSession: !!session, 
        videoId: video?._id, 
        courseId,
        isPreview 
      });
      return null;
    }
    
    const url = `/api/video/stream/${courseId}/${video._id}`;
    console.log('Video URL:', url, { isPreview, hasSession: !!session });
    return url;
  };

  const getThumbnailUrl = () => {
    // Check multiple possible thumbnail locations
    if (video?.thumbnail) {
      // If it's already a full URL, return as is
      if (video.thumbnail.startsWith('http://') || video.thumbnail.startsWith('https://')) {
        return video.thumbnail;
      }
      // If it starts with /, it's a relative path
      if (video.thumbnail.startsWith('/')) {
        return video.thumbnail;
      }
      // Otherwise, assume it's in public folder
      return `/${video.thumbnail}`;
    }
    
    // Check thumbnailData.url
    if (video?.thumbnailData?.url) {
      if (video.thumbnailData.url.startsWith('http://') || video.thumbnailData.url.startsWith('https://')) {
        return video.thumbnailData.url;
      }
      if (video.thumbnailData.url.startsWith('/')) {
        return video.thumbnailData.url;
      }
      return `/${video.thumbnailData.url}`;
    }
    
    return undefined;
  };

  // Check if video is a preview (free to watch)
  const isPreview = video?.isPreview === true;
  
  // If not logged in and not a preview video, show login prompt
  if (!session && !isPreview) {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : `/course/${courseId}/video/${video?._id}`;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-100 rounded-lg">
        <div className="text-center p-8">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
          <p className="text-gray-600 mb-6">Please log in to watch this video</p>
          <button 
            onClick={() => router.push(loginUrl)}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Login to Watch
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
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onCanPlayThrough={handleCanPlayThrough}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onStalled={handleStalled}
        onSuspend={handleSuspend}
        onSeeking={handleSeeking}
        onSeeked={handleSeeked}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        controls={false}
        playsInline
        preload="auto"
        poster={getThumbnailUrl()}
        onProgress={handleProgress}
        crossOrigin="anonymous"
        style={{
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          // Optimize for performance
          willChange: 'auto'
        }}
      >
        {getVideoUrl() && (
          <source 
            key={`${courseId}-${video?._id}-${Date.now()}`}
            src={getVideoUrl()} 
            type="video/mp4"
            onError={(e) => {
              console.error('Source error:', {
                type: e.type,
                target: e.target,
                src: e.target?.src,
                error: e.target?.error
              });
              handleError(e);
            }}
          />
        )}
        Your browser does not support the video tag.
      </video>

      {/* Loading Overlay */}
      {(isLoading || isBuffering) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>{isLoading ? 'Loading video...' : 'Buffering...'}</p>
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
                onClick={async () => {
                  setError(null);
                  setIsLoading(true);
                  setIsBuffering(false);
                  const video = videoRef.current;
                  if (video) {
                    // Cancel any pending play promise
                    if (playPromiseRef.current) {
                      try {
                        await playPromiseRef.current;
                      } catch (err) {
                        // Ignore interruption errors
                      }
                      playPromiseRef.current = null;
                    }
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

    </div>
  );
};

export default SecureVideoPlayer;
