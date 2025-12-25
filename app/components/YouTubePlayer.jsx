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

    // Replace YouTube links with fake link when copying
    const preventCopy = (e) => {
      const selection = window.getSelection().toString();
      const clipboardData = e.clipboardData || window.clipboardData;
      const fakeLink = 'https://example.com/invalid-video-link-404';
      
      // Replace YouTube links with fake link
      if (selection.includes('youtube.com') || 
          selection.includes('youtu.be') ||
          selection.includes('youtube-nocookie.com') ||
          (selection.includes(window.location.href) && (selection.includes('youtube') || selection.includes('video')))) {
        e.preventDefault();
        e.stopPropagation();
        if (clipboardData) {
          // Replace YouTube URLs with fake link
          let replacedText = selection
            .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink)
            .replace(window.location.href, fakeLink);
          clipboardData.setData('text/plain', replacedText || fakeLink);
          clipboardData.setData('text/html', `<a href="${fakeLink}">${fakeLink}</a>`);
        }
        return false;
      }
      
      // Also intercept if trying to copy from video player area
      const target = e.target;
      if (target?.closest('.relative.bg-black') || target?.closest('iframe')) {
        // Replace any YouTube links with fake link
        e.preventDefault();
        e.stopPropagation();
        if (clipboardData) {
          let textToCopy = selection || '';
          if (textToCopy.includes('youtube') || textToCopy.includes('youtu.be')) {
            textToCopy = textToCopy.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
          }
          clipboardData.setData('text/plain', textToCopy || fakeLink);
          clipboardData.setData('text/html', `<a href="${fakeLink}">${fakeLink}</a>`);
        }
        return false;
      }
    };
    
    // Monitor clicks on video player to prepare for link replacement
    const preventClickCopy = (e) => {
      const target = e.target;
      const fakeLink = 'https://example.com/invalid-video-link-404';
      
      // If clicking on video player area, prepare to replace any YouTube links
      if (target?.closest('.relative.bg-black') || target?.closest('iframe')) {
        // Set up multiple checks to catch any copy operations triggered by the click
        const checkAndReplace = () => {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(text => {
              if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('youtube-nocookie.com'))) {
                const replacedText = text.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
                if (replacedText !== text) {
                  navigator.clipboard.writeText(replacedText || fakeLink).catch(() => {});
                }
              }
            }).catch(() => {
              // Clipboard read might fail, that's okay
            });
          }
        };
        
        // Check immediately and then with delays to catch delayed copy operations
        checkAndReplace();
        setTimeout(checkAndReplace, 50);
        setTimeout(checkAndReplace, 100);
        setTimeout(checkAndReplace, 200);
        setTimeout(checkAndReplace, 500);
      }
    };
    
    // Continuous clipboard monitoring (works in both normal and fullscreen mode)
    const clipboardMonitor = setInterval(() => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(text => {
          if (text && (text.includes('youtube.com') || text.includes('youtu.be') || text.includes('youtube-nocookie.com'))) {
            const fakeLink = 'https://example.com/invalid-video-link-404';
            const replacedText = text.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
            if (replacedText !== text) {
              navigator.clipboard.writeText(replacedText || fakeLink).catch(() => {});
            }
          }
        }).catch(() => {
          // Clipboard read might fail, that's okay
        });
      }
    }, 300); // Check every 300ms
    
    // Store interval for cleanup
    window._clipboardMonitorInterval = clipboardMonitor;

    // Block clicks that might navigate to YouTube and redirect to home instead
    const preventYouTubeNavigation = (e) => {
      const target = e.target;
      // Check if click is on or near video player
      if (target?.closest('.relative.bg-black') || target?.closest('iframe')) {
        // Check if the click target or its parent is a link to YouTube
        const link = target?.closest('a[href*="youtube.com"]') || target?.closest('a[href*="youtu.be"]');
        if (link) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          // Disable YouTube navigation
          return false;
        }
      }
      
      // Check if clicking in bottom-left area ("Watch on YouTube" button area) - very precise
      const clickX = e.clientX;
      const clickY = e.clientY;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // If click is in bottom-left corner (first 5% width, bottom 10% height) - disable it
      if (clickX < windowWidth * 0.05 && clickY > windowHeight * 0.9) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return false;
      }
      
      // Also check if clicking in bottom-right corner (last 5% width, bottom 10% height) - disable it
      if (clickX > windowWidth * 0.95 && clickY > windowHeight * 0.9) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        return false;
      }
    };

    // Block beforecopy event (fires before copy)
    const preventBeforeCopy = (e) => {
      const target = e.target;
      if (target?.closest('.relative.bg-black') || target?.closest('iframe')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener('keydown', preventSharing, true);
    document.addEventListener('contextmenu', preventSharing, true);
    document.addEventListener('selectstart', preventSelection, true);
    document.addEventListener('dragstart', preventDrag, true);
    document.addEventListener('copy', preventCopy, true);
    document.addEventListener('beforecopy', preventBeforeCopy, true);
    document.addEventListener('click', preventYouTubeNavigation, true);
    document.addEventListener('click', preventClickCopy, true);
    document.addEventListener('mousedown', preventYouTubeNavigation, true);
    document.addEventListener('mousedown', preventClickCopy, true);

    return () => {
      document.removeEventListener('keydown', preventSharing, true);
      document.removeEventListener('contextmenu', preventSharing, true);
      document.removeEventListener('selectstart', preventSelection, true);
      document.removeEventListener('dragstart', preventDrag, true);
      document.removeEventListener('copy', preventCopy, true);
      document.removeEventListener('beforecopy', preventBeforeCopy, true);
      document.removeEventListener('click', preventYouTubeNavigation, true);
      document.removeEventListener('click', preventClickCopy, true);
      document.removeEventListener('mousedown', preventYouTubeNavigation, true);
      document.removeEventListener('mousedown', preventClickCopy, true);
      // Clear clipboard monitoring interval
      if (window._clipboardMonitorInterval) {
        clearInterval(window._clipboardMonitorInterval);
        delete window._clipboardMonitorInterval;
      }
    };
  }, [courseId, video?._id, video?.youtubeUrl]);

  // Monitor fullscreen changes and add blockers + clipboard monitoring
  useEffect(() => {
    const fakeLink = 'https://example.com/invalid-video-link-404';
    let fullscreenInterval = null;
    
    const handleFullscreenChange = () => {
      // Check if we're in fullscreen
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      if (isFullscreen) {
        // Add blockers to fullscreen element
        const fullscreenElement = document.fullscreenElement || 
                                  document.webkitFullscreenElement ||
                                  document.mozFullScreenElement ||
                                  document.msFullscreenElement;
        
        if (fullscreenElement) {
          // Create disable blocker for fullscreen mode (disables YouTube buttons)
          const createFullscreenDisable = (position, width, height, checkPosition = null) => {
            const blocker = document.createElement('div');
            blocker.className = 'fullscreen-blocker';
            blocker.style.cssText = `
              position: fixed;
              ${position};
              width: ${width};
              height: ${height};
              z-index: 2147483647;
              pointer-events: auto;
              background: transparent;
              cursor: not-allowed;
            `;
            const handleClick = (e) => {
              // If position check function provided, use it
              if (checkPosition) {
                const rect = blocker.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                if (!checkPosition(clickX, rect.width)) {
                  // Click is not in the target area, let it pass through
                  return;
                }
              }
              e.preventDefault();
              e.stopPropagation();
              if (e.stopImmediatePropagation) e.stopImmediatePropagation();
              // Just disable, don't redirect
              return false;
            };
            blocker.addEventListener('click', handleClick);
            blocker.addEventListener('mousedown', handleClick);
            blocker.addEventListener('mouseup', handleClick);
            blocker.addEventListener('contextmenu', handleClick);
            blocker.addEventListener('mouseenter', (e) => {
              if (checkPosition) {
                const rect = blocker.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                if (checkPosition(mouseX, rect.width)) {
                  blocker.style.cursor = 'not-allowed';
                } else {
                  blocker.style.cursor = 'default';
                }
              } else {
                blocker.style.cursor = 'not-allowed';
              }
            });
            return blocker;
          };
          
          // Create copy link interceptor for fullscreen mode (copies fake link)
          const createFullscreenCopyLink = (position, width, height) => {
            const blocker = document.createElement('div');
            blocker.className = 'fullscreen-blocker';
            blocker.style.cssText = `
              position: fixed;
              ${position};
              width: ${width};
              height: ${height};
              z-index: 2147483647;
              pointer-events: auto;
              background: transparent;
              cursor: pointer;
            `;
            blocker.addEventListener('click', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.stopImmediatePropagation) e.stopImmediatePropagation();
              
              const fakeLink = 'https://example.com/invalid-video-link-404';
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(fakeLink);
                } else {
                  // Fallback for older browsers
                  const textarea = document.createElement('textarea');
                  textarea.value = fakeLink;
                  textarea.style.position = 'fixed';
                  textarea.style.opacity = '0';
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textarea);
                }
              } catch (err) {
                console.error('Failed to copy:', err);
              }
              return false;
            });
            blocker.addEventListener('mousedown', async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.stopImmediatePropagation) e.stopImmediatePropagation();
              
              const fakeLink = 'https://example.com/invalid-video-link-404';
              try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  await navigator.clipboard.writeText(fakeLink);
                }
              } catch (err) {
                // Ignore errors
              }
              return false;
            });
            blocker.addEventListener('contextmenu', (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (e.stopImmediatePropagation) e.stopImmediatePropagation();
              return false;
            });
            return blocker;
          };
          
          // Wait a bit for fullscreen to fully initialize
          setTimeout(() => {
            // Add blockers directly to body (they'll be positioned fixed relative to viewport)
            // Top-right blocker (copy link) - copies fake link
            const topRightBlocker = createFullscreenCopyLink('top: 0; right: 0;', '96px', '40px');
            document.body.appendChild(topRightBlocker);
            
            // Bottom-left blocker ("Watch on YouTube" button) - disables button (precise, only covers button)
            const bottomLeftBlocker = createFullscreenDisable(
              'bottom: 0; left: 0;', 
              '150px', 
              '45px',
              (clickX, width) => clickX < 30 // Only block if click is in leftmost 30px
            );
            document.body.appendChild(bottomLeftBlocker);
            
            // Bottom-right blocker (YouTube logo) - disables logo (precise, only covers logo)
            const bottomRightBlocker = createFullscreenDisable(
              'bottom: 0; right: 0;', 
              '80px', 
              '40px',
              (clickX, width) => clickX > width - 20 // Only block if click is in rightmost 20px
            );
            document.body.appendChild(bottomRightBlocker);
            
            // Top-left blocker - disables top-left area
            const topLeftBlocker = createFullscreenDisable('top: 0; left: 0;', '96px', '40px');
            document.body.appendChild(topLeftBlocker);
          }, 100);
        }
        
        // Monitor clipboard in fullscreen mode
        fullscreenInterval = setInterval(() => {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(text => {
              if (text && (text.includes('youtube.com') || text.includes('youtu.be'))) {
                const replacedText = text.replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink);
                if (replacedText !== text) {
                  navigator.clipboard.writeText(replacedText || fakeLink).catch(() => {});
                }
              }
            }).catch(() => {
              // Clipboard read might fail, that's okay
            });
          }
        }, 500); // Check every 500ms in fullscreen
      } else {
        // Clear interval when exiting fullscreen
        if (fullscreenInterval) {
          clearInterval(fullscreenInterval);
          fullscreenInterval = null;
        }
        // Remove all fullscreen blockers
        const blockers = document.querySelectorAll('.fullscreen-blocker');
        blockers.forEach(blocker => blocker.remove());
      }
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
      if (fullscreenInterval) {
        clearInterval(fullscreenInterval);
      }
    };
  }, []);

  // Intercept clipboard API to replace YouTube links with fake link
  useEffect(() => {
    const fakeLink = 'https://example.com/invalid-video-link-404';
    
    // Intercept navigator.clipboard.writeText
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const originalWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async function(text) {
        // Replace YouTube URLs with fake link
        if (text && (
          text.includes('youtube.com') ||
          text.includes('youtu.be') ||
          text.includes('youtube-nocookie.com') ||
          (text.includes(window.location.href) && (text.includes('youtube') || text.includes('video')))
        )) {
          // Replace YouTube URLs with fake link
          const replacedText = text
            .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink)
            .replace(window.location.href, fakeLink);
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
          selection.includes('youtube-nocookie.com') ||
          (selection.includes(window.location.href) && (selection.includes('youtube') || selection.includes('video')))
        )) {
          // Replace YouTube URLs with fake link
          const replacedText = selection
            .replace(/https?:\/\/(www\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)[^\s]*/gi, fakeLink)
            .replace(window.location.href, fakeLink);
          
          // Create a temporary textarea to copy the fake link
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
    };

    return () => {
      // Restore original functions
      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Note: We can't fully restore, but this helps
      }
      document.execCommand = originalExecCommand;
    };
  }, [courseId, video?._id]);

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
    <div 
      className="relative bg-black rounded-lg overflow-hidden aspect-video"
      onContextMenu={(e) => {
        // Block all right-clicks on the video player
        e.preventDefault();
        e.stopPropagation();
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
          pointerEvents: 'auto',
          zIndex: 1
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
          // Block all context menus on iframe
            e.preventDefault();
          e.stopPropagation();
            return false;
        }}
      />
      
      {/* Redirect overlay for top-left corner - redirects to home page */}
      <div 
        className="absolute top-0 left-0 w-24 h-10 z-50"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onClick={(e) => {
          // Disable clicks on top-left corner
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.cursor = 'not-allowed';
        }}
      />
      
      {/* Copy link interceptor for top-right corner - copies fake link instead */}
      <div 
        className="absolute top-0 right-0 w-24 h-10 z-50"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'pointer',
          zIndex: 9999
        }}
        onClick={async (e) => {
          // Intercept copy link click and copy fake link instead
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          
          const fakeLink = 'https://example.com/invalid-video-link-404';
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(fakeLink);
            } else {
              // Fallback for older browsers
              const textarea = document.createElement('textarea');
              textarea.value = fakeLink;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
            }
          } catch (err) {
            console.error('Failed to copy:', err);
          }
          return false;
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          return false;
        }}
        onMouseDown={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();
          
          const fakeLink = 'https://example.com/invalid-video-link-404';
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(fakeLink);
            }
          } catch (err) {
            // Ignore errors
          }
          return false;
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.cursor = 'pointer';
        }}
      />
      
      {/* Disable overlay for bottom-left corner where "Watch on YouTube" button appears - makes it non-clickable */}
      <div 
        className="absolute bottom-0 left-0 w-32 h-10 z-50"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed',
          zIndex: 9999
        }}
        onClick={(e) => {
          // Only block if click is in the very left edge where button text is (first 25px)
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < 25) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
          // Let other clicks pass through to video controls
        }}
        onContextMenu={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < 25) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < 25) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < 25) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          if (mouseX < 25) {
            e.currentTarget.style.cursor = 'not-allowed';
          } else {
            e.currentTarget.style.cursor = 'default';
          }
        }}
      />
      
      {/* Disable overlay for bottom-right corner where YouTube logo appears - makes it non-clickable */}
      <div 
        className="absolute bottom-0 right-0 w-20 h-10 z-50"
        style={{ 
          pointerEvents: 'auto',
          background: 'transparent',
          cursor: 'not-allowed',
          zIndex: 9999
        }}
        onClick={(e) => {
          // Only block if click is in the very right edge (where YouTube logo is)
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          // Only block if click is in the rightmost 18px (where the logo is)
          if (clickX > width - 18) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
          // Let other clicks pass through to video controls
        }}
        onContextMenu={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          if (clickX > width - 18) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          if (clickX > width - 18) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseUp={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const width = rect.width;
          if (clickX > width - 18) {
            e.preventDefault();
            e.stopPropagation();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            return false;
          }
        }}
        onMouseEnter={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const width = rect.width;
          if (mouseX > width - 18) {
            e.currentTarget.style.cursor = 'not-allowed';
          } else {
            e.currentTarget.style.cursor = 'default';
          }
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
        
        /* Hide copy link button specifically - more aggressive selectors */
        button[aria-label*="Copy link"],
        button[aria-label*="copy link"],
        button[title*="Copy link"],
        button[title*="copy link"],
        [data-tooltip*="Copy link"],
        [data-tooltip*="copy link"],
        .ytp-copylink-button,
        [class*="copylink"],
        [class*="copy-link"],
        [id*="copylink"],
        [id*="copy-link"] {
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
      `}} />
    </div>
  );
};

export default YouTubePlayer;

