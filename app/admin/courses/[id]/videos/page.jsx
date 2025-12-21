'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ChunkedUploader, shouldUseChunkedUpload, getOptimalChunkSize } from '@/lib/chunkedUpload';

export default function CourseVideosPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;
  
  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    fetchCourseVideos();
  }, [router, courseId]);

  const fetchCourseVideos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/courses/${courseId}/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCourse({ title: data.courseTitle });
        setVideos(data.videos);
      } else {
        alert('Error fetching course videos');
      }
    } catch (error) {
      console.error('Error fetching course videos:', error);
      alert('Error fetching course videos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async (videoData) => {
    // This function is no longer used since we only support video uploads
    // Video uploads are handled directly in the form submission
    console.log('handleAddVideo called - this should not happen with video uploads');
  };

  const handleUpdateVideo = async (videoId, videoData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/courses/${courseId}/videos`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId, ...videoData })
      });

      if (response.ok) {
        fetchCourseVideos();
        setEditingVideo(null);
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating video');
      }
    } catch (error) {
      console.error('Error updating video:', error);
      alert('Error updating video');
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/courses/${courseId}/videos`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoId })
      });

      if (response.ok) {
        fetchCourseVideos();
      } else {
        alert('Error deleting video');
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error deleting video');
    }
  };

  const handleRegenerateThumbnail = async (videoId) => {
    if (!confirm('Are you sure you want to regenerate the thumbnail for this video?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/regenerate-thumbnail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ courseId, videoId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Thumbnail regenerated:', result.thumbnail);
        fetchCourseVideos(); // Refresh the list to show new thumbnail
        alert('Thumbnail regenerated successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Error regenerating thumbnail');
      }
    } catch (error) {
      console.error('Error regenerating thumbnail:', error);
      alert('Error regenerating thumbnail');
    }
  };

  const moveVideo = async (videoId, direction) => {
    const videoIndex = videos.findIndex(v => v._id === videoId);
    if (videoIndex === -1) return;

    const newIndex = direction === 'up' ? videoIndex - 1 : videoIndex + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;

    // Swap orders
    const updatedVideos = [...videos];
    const temp = updatedVideos[videoIndex].order;
    updatedVideos[videoIndex].order = updatedVideos[newIndex].order;
    updatedVideos[newIndex].order = temp;

    // Update both videos
    for (const video of [updatedVideos[videoIndex], updatedVideos[newIndex]]) {
      await handleUpdateVideo(video._id, { order: video.order });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/admin/courses" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Videos</h1>
                <p className="text-sm text-gray-600">{course?.title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add Video
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Videos List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {videos.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {videos.map((video, index) => (
                <div key={video._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Video Thumbnail */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to default icon if thumbnail fails to load
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${
                            video.thumbnail ? 'hidden' : 'flex'
                          }`}
                        >
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <div className="w-8 h-8 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          #{video.order}
                        </span>
                        {video.youtubeUrl ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            YouTube Unlisted
                          </span>
                        ) : video.vimeoUrl || video.vimeoVideoId ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Vimeo Video
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Uploaded Video
                          </span>
                        )}
                        {(video.isFreePreview || video.isPreview) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Free Preview
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {video.title}
                      </h3>
                      
                      {video.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {video.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Duration: {video.duration}</span>
                        {video.youtubeUrl ? (
                          <>
                            <span>•</span>
                            <span className="text-red-600 font-medium">
                              YouTube Unlisted Video
                            </span>
                          </>
                        ) : video.vimeoUrl || video.vimeoVideoId ? (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">
                              Vimeo: {video.vimeoVideoId || 'N/A'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span className="text-purple-600 font-medium">
                              Secure Uploaded Video
                            </span>
                            {video.fileSize && (
                              <span className="text-gray-400">
                                • {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {/* Move Up/Down */}
                      <button
                        onClick={() => moveVideo(video._id, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveVideo(video._id, 'down')}
                        disabled={index === videos.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Regenerate Thumbnail */}
                      {video.videoPath && (
                        <button
                          onClick={() => handleRegenerateThumbnail(video._id)}
                          className="p-2 text-green-600 hover:text-green-800"
                          title="Regenerate thumbnail"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}

                      {/* Edit */}
                      <button
                        onClick={() => setEditingVideo(video)}
                        className="p-2 text-blue-600 hover:text-blue-800"
                        title="Edit video"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteVideo(video._id)}
                        className="p-2 text-red-600 hover:text-red-800"
                        title="Delete video"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding a new video.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Video
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Video Modal */}
      {(showAddModal || editingVideo) && (
        <VideoModal
          courseId={courseId}
          video={editingVideo}
          onClose={() => {
            setShowAddModal(false);
            setEditingVideo(null);
          }}
          onSave={editingVideo ? handleUpdateVideo : handleAddVideo}
        />
      )}
    </div>
  );
}

// Video Modal Component
function VideoModal({ courseId, video, onClose, onSave }) {
  // Determine video source type based on existing video
  const getVideoSourceType = () => {
    if (video?.youtubeUrl) return 'youtube';
    if (video?.vimeoUrl || video?.vimeoVideoId) return 'vimeo';
    return 'youtube'; // Default to YouTube
  };

  const [videoSourceType, setVideoSourceType] = useState(getVideoSourceType());
  
  const [formData, setFormData] = useState({
    title: video?.title || '',
    description: video?.description || '',
    youtubeUrl: video?.youtubeUrl || '',
    vimeoUrl: video?.vimeoUrl || video?.vimeoVideoId ? `https://vimeo.com/${video.vimeoVideoId}` : '',
    duration: video?.duration || '',
    isFreePreview: video?.isFreePreview || video?.isPreview || false,
    // Legacy support - keep for existing videos
    videoFile: null,
    thumbnailFile: null,
    isPreview: video?.isPreview || false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get admin token
      const token = localStorage.getItem('adminToken');
      if (!token) {
        alert('Please log in to add videos');
        setIsSubmitting(false);
        return;
      }

      // Determine if this is an edit or add operation
      const isEdit = !!video;
      const apiMethod = isEdit ? 'PUT' : 'POST';

      // Handle YouTube videos
      if (videoSourceType === 'youtube') {
        // Validate YouTube URL
        if (!formData.youtubeUrl || !formData.youtubeUrl.trim()) {
          alert('Please enter a YouTube unlisted video URL');
          setIsSubmitting(false);
          return;
        }

        // Validate YouTube URL format
        const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
        if (!youtubeUrlPattern.test(formData.youtubeUrl.trim())) {
          alert('Please enter a valid YouTube URL. Format: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID');
          setIsSubmitting(false);
          return;
        }

        console.log(`${isEdit ? 'Updating' : 'Adding'} YouTube video:`, {
          title: formData.title,
          youtubeUrl: formData.youtubeUrl,
          isFreePreview: formData.isFreePreview
        });

        // Call API to add/update YouTube video
        const response = await fetch(`/api/admin/courses/${courseId}/videos`, {
          method: apiMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            videoId: isEdit ? video._id : undefined,
            title: formData.title,
            description: formData.description || '',
            youtubeUrl: formData.youtubeUrl.trim(),
            duration: formData.duration,
            isPreview: formData.isFreePreview
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add video');
        }

        const result = await response.json();
        console.log(`Video ${isEdit ? 'updated' : 'added'} successfully:`, result);
        
        // Call onSave callback if provided (for edit mode)
        if (isEdit && onSave) {
          await onSave(video._id, {
            title: formData.title,
            description: formData.description,
            youtubeUrl: formData.youtubeUrl.trim(),
            duration: formData.duration,
            isFreePreview: formData.isFreePreview
          });
        }
        
        onClose();
        window.location.reload();
        return;
      }

      // Handle Vimeo videos
      if (videoSourceType === 'vimeo') {
        // Validate Vimeo URL
        if (!formData.vimeoUrl || !formData.vimeoUrl.trim()) {
          alert('Please enter a Vimeo video URL');
          setIsSubmitting(false);
          return;
        }

        // Validate Vimeo URL format
        const vimeoUrlPattern = /^https?:\/\/(www\.)?(vimeo\.com\/|player\.vimeo\.com\/video\/)\d+/;
        if (!vimeoUrlPattern.test(formData.vimeoUrl.trim())) {
          alert('Please enter a valid Vimeo URL. Format: https://vimeo.com/123456789');
          setIsSubmitting(false);
          return;
        }

        // Extract Vimeo video ID
        const vimeoMatch = formData.vimeoUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/);
        if (!vimeoMatch || !vimeoMatch[1]) {
          alert('Could not extract Vimeo video ID from URL');
          setIsSubmitting(false);
          return;
        }

        const vimeoVideoId = vimeoMatch[1];
      
        console.log(`${isEdit ? 'Updating' : 'Adding'} Vimeo video:`, {
          title: formData.title,
          vimeoUrl: formData.vimeoUrl,
          vimeoVideoId: vimeoVideoId,
          isFreePreview: formData.isFreePreview
        });

        // Call API to add/update Vimeo video
        const response = await fetch('/api/admin/video-vimeo', {
          method: apiMethod,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            courseId: courseId,
            videoId: isEdit ? video._id : undefined,
            title: formData.title,
            description: formData.description || '',
            vimeoUrl: formData.vimeoUrl.trim(),
            vimeoVideoId: vimeoVideoId,
            duration: formData.duration,
            isFreePreview: formData.isFreePreview
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add video');
        }

        const result = await response.json();
        console.log(`Video ${isEdit ? 'updated' : 'added'} successfully:`, result);
        
        // Call onSave callback if provided (for edit mode)
        if (isEdit && onSave) {
          await onSave(video._id, {
            title: formData.title,
            description: formData.description,
            vimeoUrl: formData.vimeoUrl.trim(),
            vimeoVideoId: vimeoVideoId,
            duration: formData.duration,
            isFreePreview: formData.isFreePreview
          });
        }
        
        onClose();
        window.location.reload();
        return;
      }

    } catch (error) {
      console.error('Error uploading video:', error);
      let errorMsg = error.message || 'Unknown error occurred';
      
      // Provide user-friendly error messages
      if (errorMsg.includes('ERR_HTTP2') || errorMsg.includes('Failed to fetch')) {
        errorMsg = 'Network connection error. Please check your internet connection and try again. If the problem persists, the server may be experiencing issues.';
      } else if (errorMsg.includes('timeout')) {
        errorMsg = 'Upload timeout: The upload took too long. Please try again or use a smaller file.';
      }
      
      alert('Error uploading video: ' + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to create fetch with timeout
  const fetchWithTimeout = async (url, options, timeoutMs = 300000) => { // 5 minutes default
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout: The upload took too long. Please try again or use a smaller file.');
      }
      throw error;
    }
  };

  // Retry helper with exponential backoff
  const retryWithBackoff = async (fn, maxRetries = 2, baseDelay = 1000) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isNetworkError = error.message.includes('Failed to fetch') || 
                              error.message.includes('ERR_HTTP2') ||
                              error.message.includes('NetworkError') ||
                              error.message.includes('timeout');
        
        if (attempt === maxRetries || !isNetworkError) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Upload attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleRegularUpload = async (token, retryCount = 0) => {
    // Create form data for upload
    const uploadFormData = new FormData();
    uploadFormData.append('video', formData.videoFile);
    uploadFormData.append('courseId', courseId);
    uploadFormData.append('title', formData.title);
    uploadFormData.append('description', formData.description);
    uploadFormData.append('duration', formData.duration);
    uploadFormData.append('isPreview', formData.isPreview);

    if (formData.thumbnailFile) {
      uploadFormData.append('thumbnail', formData.thumbnailFile);
    }

    console.log('Uploading video via regular upload...', retryCount > 0 ? `(Retry ${retryCount})` : '');
    
    try {
      // Use retry with timeout (5 minutes for video uploads)
      const response = await retryWithBackoff(async () => {
        return await fetchWithTimeout('/api/admin/video-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadFormData
        }, 300000); // 5 minute timeout
      }, 2); // Max 2 retries

      if (response.ok) {
        const result = await response.json();
        console.log('Video uploaded successfully:', result);
        onClose();
        window.location.reload();
      } else {
        let errorMessage = 'Error uploading video';

        if (response.status === 413) {
          errorMessage = 'Video file is too large! Please use a video smaller than 100MB or compress it.';
        } else if (response.status === 400) {
          try {
            const error = await response.json();
            errorMessage = error.error || 'Invalid video file or missing required fields';
          } catch (jsonError) {
            errorMessage = 'Invalid video file or missing required fields';
          }
        } else {
          try {
            const error = await response.json();
            errorMessage = error.error || errorMessage;
          } catch (jsonError) {
            try {
              const errorText = await response.text();
              console.error('Non-JSON error response:', errorText);
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            } catch (textError) {
              console.error('Could not parse error response:', textError);
              errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Check if it's a network error that might benefit from chunked upload
      const isNetworkError = error.message.includes('Failed to fetch') || 
                            error.message.includes('ERR_HTTP2') ||
                            error.message.includes('NetworkError') ||
                            error.message.includes('timeout');
      
      if (isNetworkError && retryCount === 0) {
        // Try chunked upload as fallback for network errors
        console.log('Regular upload failed with network error, trying chunked upload as fallback...');
        try {
          await handleChunkedUpload(token);
          return; // Success, exit
        } catch (chunkedError) {
          // Chunked upload also failed, show error
          throw new Error(`Upload failed: ${error.message}. Chunked upload also failed: ${chunkedError.message}`);
        }
      }
      
      // Re-throw the error to be handled by caller
      throw error;
    }
  };

  const handleChunkedUpload = async (token) => {
    const chunkSize = getOptimalChunkSize(formData.videoFile.size);
    console.log(`Using chunked upload with ${chunkSize} byte chunks`);

    const uploader = new ChunkedUploader(formData.videoFile, {
      chunkSize: chunkSize,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      onProgress: (progress, message) => {
        console.log(`Upload progress: ${progress.toFixed(1)}% - ${message}`);
        // You could update a progress bar here
      },
      onError: (error) => {
        console.error('Chunked upload error:', error);
        throw error;
      },
      onSuccess: (result) => {
        console.log('Chunked upload completed successfully:', result);
        onClose();
        window.location.reload();
      }
    });

    // Override getAdditionalFormData to include our form data
    uploader.getAdditionalFormData = () => ({
      courseId: courseId,
      title: formData.title,
      description: formData.description,
      duration: formData.duration,
      isPreview: formData.isPreview.toString(),
      ...(formData.thumbnailFile && { thumbnail: formData.thumbnailFile })
    });

    await uploader.upload();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {video ? 'Edit Video' : 'Add New Video'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter video description (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Video Source Type *</label>
              <div className="flex space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="youtube"
                    checked={videoSourceType === 'youtube'}
                    onChange={(e) => setVideoSourceType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">YouTube Unlisted</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="vimeo"
                    checked={videoSourceType === 'vimeo'}
                    onChange={(e) => setVideoSourceType(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Vimeo</span>
                </label>
              </div>
            </div>

            {videoSourceType === 'youtube' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Unlisted Video URL *</label>
                <input
                  type="url"
                  required
                  value={formData.youtubeUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the YouTube unlisted video URL. The video will play on your website, not redirect to YouTube.
                </p>
                <ul className="mt-1 text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>https://www.youtube.com/watch?v=VIDEO_ID</li>
                  <li>https://youtu.be/VIDEO_ID</li>
                </ul>
                {formData.youtubeUrl && formData.youtubeUrl.match(/(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/) && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    ✓ Valid YouTube URL detected
                  </div>
                )}
                {formData.youtubeUrl && !formData.youtubeUrl.match(/(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/) && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Please enter a valid YouTube URL
                  </div>
                )}
              </div>
            )}

            {videoSourceType === 'vimeo' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vimeo Video URL *</label>
                <input
                  type="url"
                  required
                  value={formData.vimeoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, vimeoUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://vimeo.com/123456789 or https://player.vimeo.com/video/123456789"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Enter the full Vimeo URL. Examples:
                </p>
                <ul className="mt-1 text-xs text-gray-400 list-disc list-inside space-y-1">
                  <li>https://vimeo.com/123456789</li>
                  <li>https://player.vimeo.com/video/123456789</li>
                </ul>
                {formData.vimeoUrl && formData.vimeoUrl.match(/vimeo\.com\/\d+|player\.vimeo\.com\/video\/\d+/) && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    ✓ Valid Vimeo URL detected
                  </div>
                )}
                {formData.vimeoUrl && !formData.vimeoUrl.match(/vimeo\.com\/\d+|player\.vimeo\.com\/video\/\d+/) && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    ⚠️ Please enter a valid Vimeo URL
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail Image (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData(prev => ({ ...prev, thumbnailFile: e.target.files[0] }))}
                  className="hidden"
                  id="thumbnail-upload"
                />
                <label htmlFor="thumbnail-upload" className="cursor-pointer">
                  {formData.thumbnailFile ? (
                    <div className="text-green-600">
                      <img
                        src={URL.createObjectURL(formData.thumbnailFile)}
                        alt="Thumbnail preview"
                        className="w-24 h-16 mx-auto mb-2 object-cover rounded border"
                      />
                      <p className="font-medium">{formData.thumbnailFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {(formData.thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="font-medium">Click to upload thumbnail image</p>
                      <p className="text-sm">or drag and drop</p>
                    </div>
                  )}
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Supported formats: PNG, JPG, JPEG, GIF (Max size: 5MB)
              </p>
              {formData.thumbnailFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  ✓ Thumbnail selected: {formData.thumbnailFile.name} ({(formData.thumbnailFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration *</label>
              <input
                type="text"
                required
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 15:30, 1:25:45"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter duration in format MM:SS or HH:MM:SS
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFreePreview"
                checked={formData.isFreePreview}
                onChange={(e) => setFormData(prev => ({ ...prev, isFreePreview: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFreePreview" className="ml-2 text-sm text-gray-700">
                This is a free preview video (accessible without purchase)
              </label>
            </div>
            <p className="text-xs text-gray-500 -mt-2">
              Unchecked videos will require course purchase to view
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : (video ? 'Update Video' : 'Add Video')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
