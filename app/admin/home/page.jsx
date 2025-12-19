'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminHomeEditorPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [content, setContent] = useState(null);
  const [jsonDraft, setJsonDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    const admin = localStorage.getItem('adminInfo');
    if (!t || !admin) {
      router.push('/admin/login');
      return;
    }
    setToken(t);
    loadContent(t);
  }, [router]);

  const loadContent = async (t) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/home', {
        headers: { Authorization: `Bearer ${t}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load');
      const normalized = data.content || {
        slug: 'default',
        seo: { title: '', description: '', image: '', url: '' },
        heroSlides: [],
        packages: [],
        instructors: [],
        testimonials: [],
        texts: []
      };
      setContent(normalized);
      // Clean large base64 images before displaying in JSON editor
      const cleaned = cleanDataUrls(normalized);
      setJsonDraft(JSON.stringify(cleaned, null, 2));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean data URLs (base64 images) from the payload to reduce size
  // IMPORTANT: Only remove base64 data URLs, NOT file paths like /uploads/filename.jpg
  const cleanDataUrls = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => cleanDataUrls(item));
    }
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.startsWith('data:image')) {
        // Replace base64 data URLs with empty string or keep only if small
        // DO NOT remove file paths like /uploads/filename.jpg
        if (value.length > 100000) { // If larger than ~100KB, remove it
          console.warn(`Removing large base64 image from ${key} (${(value.length / 1024).toFixed(2)}KB)`);
          cleaned[key] = '';
        } else {
          cleaned[key] = value;
        }
      } else if (typeof value === 'string' && value.startsWith('/uploads/')) {
        // Preserve file paths - these are valid image URLs that should be saved
        cleaned[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = cleanDataUrls(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  };

  // Update helpers for Slides and Testimonials
  const updateSlides = (updater) => {
    setContent((prev) => {
      const next = { ...prev, heroSlides: updater([...(prev?.heroSlides || [])]) };
      // Clean large base64 images before displaying in JSON editor
      const cleaned = cleanDataUrls(next);
      setJsonDraft(JSON.stringify(cleaned, null, 2));
      return next;
    });
  };

  const uploadImage = async (file) => {
    const form = new FormData();
    form.append('file', file);
    
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Upload API returned non-JSON:', text.substring(0, 500));
        throw new Error('Upload failed: Server returned invalid response');
      }
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        const errorMsg = data.message || `Upload failed with status ${res.status}`;
        console.error('Upload failed:', errorMsg);
        throw new Error(errorMsg);
      }
      
      if (!data.url) {
        throw new Error('Upload succeeded but no URL returned');
      }
      
      console.log('Image uploaded successfully:', data.url);
      
      // Verify the image is accessible (with retry for timing issues)
      const verifyImage = async (url, retries = 3) => {
        for (let i = 0; i < retries; i++) {
          try {
            // Add cache busting query parameter
            const testUrl = url + (url.includes('?') ? '&' : '?') + '_verify=' + Date.now();
            const imgRes = await fetch(testUrl, { method: 'HEAD' });
            
            if (imgRes.ok) {
              console.log('Image verified and accessible:', url);
              return true;
            } else if (imgRes.status === 404) {
              console.warn(`Image not found (404) - attempt ${i + 1}/${retries}:`, url);
              if (i < retries - 1) {
                // Wait a bit before retrying (file might still be writing)
                await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
                continue;
              } else {
                console.error('Image verification failed after retries:', url);
                // Don't throw - the file might still be accessible, just not yet
                // The user will see an error when the image fails to load
                return false;
              }
            } else {
              console.warn(`Image verification returned ${imgRes.status}:`, url);
              return false;
            }
          } catch (verifyError) {
            console.warn(`Image verification error (attempt ${i + 1}/${retries}):`, verifyError.message);
            if (i < retries - 1) {
              await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
            }
          }
        }
        return false;
      };
      
      // Verify image is accessible (non-blocking)
      verifyImage(data.url).then(verified => {
        if (!verified) {
          console.warn('⚠️ Image uploaded but may not be immediately accessible. This could be a server configuration issue.');
          console.warn('If images fail to load, check Nginx configuration for /uploads location block.');
        }
      });
      
      return data.url;
    } catch (error) {
      console.error('Image upload error:', error);
      if (error.message.includes('413') || error.message.includes('too large')) {
        throw new Error('File is too large. Please use an image smaller than 20MB.');
      }
      throw error;
    }
  };

  const updateTestimonials = (updater) => {
    setContent((prev) => {
      const next = { ...prev, testimonials: updater([...(prev?.testimonials || [])]) };
      // Clean large base64 images before displaying in JSON editor
      const cleaned = cleanDataUrls(next);
      setJsonDraft(JSON.stringify(cleaned, null, 2));
      return next;
    });
  };

  const updatePackages = (updater) => {
    setContent((prev) => {
      const next = { ...prev, packages: updater([...(prev?.packages || [])]) };
      // Clean large base64 images before displaying in JSON editor
      const cleaned = cleanDataUrls(next);
      setJsonDraft(JSON.stringify(cleaned, null, 2));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonDraft);
      } catch (e) {
        throw new Error('Invalid JSON');
      }

      // Check for base64 images before cleaning
      const hasLargeBase64 = JSON.stringify(parsed).includes('data:image') && 
        JSON.stringify(parsed).match(/data:image[^"]{100000,}/g);
      
      if (hasLargeBase64) {
        const warnMsg = 'Warning: Your data contains large base64-encoded images. These will be automatically removed to reduce payload size. Make sure to upload images using the file upload buttons instead. Continue?';
        if (!confirm(warnMsg)) {
          setSaving(false);
          return;
        }
      }

      // Clean base64 data URLs to reduce payload size
      const cleaned = cleanDataUrls(parsed);
      
      // Compress JSON (remove whitespace)
      const jsonString = JSON.stringify(cleaned);
      const sizeInMB = new Blob([jsonString]).size / (1024 * 1024);
      
      // Log what we're sending for debugging, including image URLs
      const packageImages = cleaned.packages?.map((pkg, i) => ({
        index: i,
        title: pkg.title,
        image: pkg.image || 'NO IMAGE'
      })) || [];
      const slideImages = cleaned.heroSlides?.map((slide, i) => ({
        index: i,
        id: slide.id,
        image: slide.image || 'NO IMAGE'
      })) || [];
      const testimonialImages = cleaned.testimonials?.map((test, i) => ({
        index: i,
        author: test.author,
        image: test.image || 'NO IMAGE'
      })) || [];

      console.log('Saving homepage data:', {
        packagesCount: cleaned.packages?.length || 0,
        slidesCount: cleaned.heroSlides?.length || 0,
        testimonialsCount: cleaned.testimonials?.length || 0,
        payloadSize: `${sizeInMB.toFixed(2)}MB`,
        packageImages: packageImages,
        slideImages: slideImages,
        testimonialImages: testimonialImages
      });

      // Check size before sending
      if (sizeInMB > 4.5) { // Warn if approaching typical 5MB limit
        const confirmMsg = `Warning: Your data is ${sizeInMB.toFixed(2)}MB, which may be too large. Large base64-encoded images have been removed. Continue anyway?`;
        if (!confirm(confirmMsg)) {
          setSaving(false);
          return;
        }
      }

      const res = await fetch('/api/admin/home?' + Date.now(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          Authorization: `Bearer ${token}`
        },
        cache: 'no-store',
        body: jsonString
      });

      // Check if response is JSON before parsing
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch (jsonError) {
          // If JSON parsing fails, read as text to see what we got
          const text = await res.text();
          console.error('Failed to parse JSON response:', text.substring(0, 500));
          throw new Error(`Server returned invalid response. Status: ${res.status}. ${res.status === 413 ? 'Request body is too large. Please reduce image sizes or use external image URLs instead of base64 data.' : 'Please try again.'}`);
        }
      } else {
        // Response is not JSON (likely HTML error page)
        const text = await res.text();
        console.error('Server returned non-JSON response:', text.substring(0, 500));
        
        if (res.status === 413) {
          throw new Error('Request body is too large. The server rejected your request. Please reduce the size of your content, especially image data. Consider using external image URLs instead of base64-encoded images.');
        } else {
          throw new Error(`Server error (${res.status}). Please try again or contact support.`);
        }
      }
      
      // Log response for debugging
      console.log('Save response:', {
        status: res.status,
        ok: res.ok,
        dataOk: data.ok,
        packagesCount: data.content?.packages?.length || 0
      });

      if (!res.ok || !data.ok) {
        const errorMsg = data.message || 'Failed to save';
        console.error('Save failed:', errorMsg);
        throw new Error(errorMsg);
      }

      // Validate that packages were saved
      if (data.content && Array.isArray(data.content.packages)) {
        console.log('Packages saved successfully:', data.content.packages.length);
      } else {
        console.warn('Warning: Packages may not have been saved correctly');
      }

      setContent(data.content);
      setJsonDraft(JSON.stringify(cleanDataUrls(data.content), null, 2));
      setSuccessMessage('✅ Changes saved successfully! The homepage will update immediately. If you don\'t see changes, try clearing your browser cache or doing a hard refresh (Ctrl+Shift+R or Cmd+Shift+R).');
    } catch (e) {
      console.error('Save error:', e);
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Homepage Editor</h1>
        <button
          className="bg-gray-200 px-3 py-2 rounded"
          onClick={() => loadContent(token)}
        >Reload</button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded border border-green-300">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Edit JSON</h2>
          <p className="text-sm text-gray-600 mb-2">Edit texts, images, slides, packages, instructors, and testimonials. Save to apply.</p>
          <textarea
            className="w-full h-[600px] font-mono text-sm border rounded p-3"
            value={jsonDraft}
            onChange={(e) => setJsonDraft(e.target.value)}
          />
          <div className="mt-3 flex gap-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              onClick={handleSave}
              disabled={saving}
            >{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>

          {/* Slides Form */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Slides</h2>
            <div className="space-y-4">
              {(content?.heroSlides || []).map((s, i) => (
                <div key={i} className="border rounded p-3 space-y-2 bg-white shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={s.image || ''}
                        onChange={(e) => updateSlides((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], image: e.target.value };
                          return copy;
                        })}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingIndex(i);
                              const url = await uploadImage(file);
                              updateSlides((arr) => {
                                const copy = [...arr];
                                copy[i] = { ...copy[i], image: url };
                                return copy;
                              });
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setUploadingIndex(null);
                              e.target.value = '';
                            }
                          }}
                          className="text-sm"
                        />
                        {uploadingIndex === i && <span className="text-xs text-gray-500">Uploading…</span>}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Alt</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={s.alt || ''}
                        onChange={(e) => updateSlides((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], alt: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-xs text-gray-500">id: {s.id ?? i + 1}</div>
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => updateSlides((arr) => arr.filter((_, idx) => idx !== i))}
                    >Remove</button>
                  </div>
                </div>
              ))}
              <button
                className="bg-gray-800 hover:bg-black text-white px-3 py-2 rounded text-sm"
                onClick={() => updateSlides((arr) => [...arr, { id: (arr[arr.length-1]?.id || arr.length) + 1, image: '', alt: '' }])}
              >Add Slide</button>
            </div>
          </div>

          {/* Testimonials Form */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Hear from Our Success Stories</h2>
            <div className="space-y-4">
              {(content?.testimonials || []).map((t, i) => (
                <div key={i} className="border rounded p-3 space-y-2 bg-white shadow-sm">
                  <div>
                    <label className="text-sm font-medium">Text</label>
                    <textarea
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows={3}
                      value={t.text || ''}
                      onChange={(e) => updateTestimonials((arr) => {
                        const copy = [...arr];
                        copy[i] = { ...copy[i], text: e.target.value };
                        return copy;
                      })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Author</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={t.author || ''}
                        onChange={(e) => updateTestimonials((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], author: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={t.role || ''}
                        onChange={(e) => updateTestimonials((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], role: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Rating (1-5)</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={t.rating ?? ''}
                        onChange={(e) => updateTestimonials((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], rating: Number(e.target.value) };
                          return copy;
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={t.image || ''}
                        onChange={(e) => updateTestimonials((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], image: e.target.value };
                          return copy;
                        })}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingIndex(i);
                              const url = await uploadImage(file);
                              updateTestimonials((arr) => {
                                const copy = [...arr];
                                copy[i] = { ...copy[i], image: url };
                                return copy;
                              });
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setUploadingIndex(null);
                              e.target.value = '';
                            }
                          }}
                          className="text-sm"
                        />
                        {uploadingIndex === i && <span className="text-xs text-gray-500">Uploading…</span>}
                        {t.image && (
                          <button
                            className="text-red-600 text-xs"
                            onClick={() => updateTestimonials((arr) => {
                              const copy = [...arr];
                              copy[i] = { ...copy[i], image: '' };
                              return copy;
                            })}
                          >Clear Image</button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {t.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.image} alt={t.author || `testimonial-${i}`} className="w-24 h-24 rounded-full object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-xs text-gray-500">id: {t.id ?? i + 1}</div>
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => updateTestimonials((arr) => arr.filter((_, idx) => idx !== i))}
                    >Remove</button>
                  </div>
                </div>
              ))}
              <button
                className="bg-gray-800 hover:bg-black text-white px-3 py-2 rounded text-sm"
                onClick={() => updateTestimonials((arr) => [...arr, { id: (arr[arr.length-1]?.id || arr.length) + 1, text: '', author: '', role: '', rating: 5 }])}
              >Add Testimonial</button>
            </div>
            <div className="mt-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleSave}
                disabled={saving}
              >{saving ? 'Saving...' : 'Save Testimonials'}</button>
            </div>
          </div>

          {/* Packages Form */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-3">Our Exclusive Packages</h2>
            <div className="space-y-4">
              {(content?.packages || []).map((p, i) => (
                <div key={i} className="border rounded p-3 space-y-2 bg-white shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.title || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], title: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Courses</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.courses || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], courses: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium">Hours</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.hours || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], hours: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Enrollments</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.enrollments || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], enrollments: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Link</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.link || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], link: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Price</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.price || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], price: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Old Price</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.oldPrice || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], oldPrice: e.target.value };
                          return copy;
                        })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Features (one per line)</label>
                    <textarea
                      className="w-full border rounded px-3 py-2 text-sm"
                      rows={3}
                      value={(p.features || []).join('\n')}
                      onChange={(e) => updatePackages((arr) => {
                        const copy = [...arr];
                        copy[i] = { ...copy[i], features: e.target.value.split('\n').filter(f => f.trim()) };
                        return copy;
                      })}
                      placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Image URL</label>
                      <input
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={p.image || ''}
                        onChange={(e) => updatePackages((arr) => {
                          const copy = [...arr];
                          copy[i] = { ...copy[i], image: e.target.value };
                          return copy;
                        })}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              setUploadingIndex(i);
                              const url = await uploadImage(file);
                              updatePackages((arr) => {
                                const copy = [...arr];
                                copy[i] = { ...copy[i], image: url };
                                return copy;
                              });
                            } catch (err) {
                              alert(err.message);
                            } finally {
                              setUploadingIndex(null);
                              e.target.value = '';
                            }
                          }}
                          className="text-sm"
                        />
                        {uploadingIndex === i && <span className="text-xs text-gray-500">Uploading…</span>}
                        {p.image && (
                          <button
                            className="text-red-600 text-xs"
                            onClick={() => updatePackages((arr) => {
                              const copy = [...arr];
                              copy[i] = { ...copy[i], image: '' };
                              return copy;
                            })}
                          >Clear Image</button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt={p.title || `package-${i}`} className="w-24 h-24 rounded object-cover" />
                      ) : (
                        <div className="w-24 h-24 rounded bg-gray-100 flex items-center justify-center text-xs text-gray-400">No image</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="text-xs text-gray-500">Package #{i + 1}</div>
                    <button
                      className="text-red-600 text-sm"
                      onClick={() => updatePackages((arr) => arr.filter((_, idx) => idx !== i))}
                    >Remove</button>
                  </div>
                </div>
              ))}
              <button
                className="bg-gray-800 hover:bg-black text-white px-3 py-2 rounded text-sm"
                onClick={() => updatePackages((arr) => [...arr, { title: '', courses: '', hours: '', enrollments: '', price: '', oldPrice: '', features: [], image: '', link: '' }])}
              >Add Package</button>
            </div>
            <div className="mt-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                onClick={handleSave}
                disabled={saving}
              >{saving ? 'Saving...' : 'Save Packages'}</button>
            </div>
          </div>
        </div>

        {/* Simple Preview */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Preview (simplified)</h2>
          <div className="border rounded p-3 space-y-6">
            {/* Slides */}
            <div>
              <h3 className="font-semibold">Hero Slides</h3>
              <div className="grid grid-cols-2 gap-3">
                {(content?.heroSlides || []).map((s, i) => (
                  <div key={i} className="border rounded overflow-hidden">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.image} alt={s.alt || `slide-${i}`} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="h-32 flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Texts */}
            <div>
              <h3 className="font-semibold">Texts</h3>
              <ul className="text-sm list-disc pl-5 space-y-1">
                {(content?.texts || []).slice(0, 6).map((t, i) => (
                  <li key={i}>
                    <span className="font-medium">{t.key}:</span> {t.value}
                  </li>
                ))}
              </ul>
            </div>

            {/* Packages */}
            <div>
              <h3 className="font-semibold">Packages</h3>
              <div className="space-y-2">
                {(content?.packages || []).slice(0, 3).map((p, i) => (
                  <div key={i} className="border rounded p-2 text-sm">
                    <div className="font-medium">{p.title || 'Untitled Package'}</div>
                    <div className="text-gray-600">{p.courses} courses • {p.hours} hours</div>
                    <div className="text-blue-600 font-bold">{p.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
