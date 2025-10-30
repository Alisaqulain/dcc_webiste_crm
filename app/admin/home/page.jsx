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
      setJsonDraft(JSON.stringify(normalized, null, 2));
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update helpers for Slides and Testimonials
  const updateSlides = (updater) => {
    setContent((prev) => {
      const next = { ...prev, heroSlides: updater([...(prev?.heroSlides || [])]) };
      setJsonDraft(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const uploadImage = async (file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.url;
  };

  const updateTestimonials = (updater) => {
    setContent((prev) => {
      const next = { ...prev, testimonials: updater([...(prev?.testimonials || [])]) };
      setJsonDraft(JSON.stringify(next, null, 2));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonDraft);
      } catch (e) {
        throw new Error('Invalid JSON');
      }
      const res = await fetch('/api/admin/home', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Failed to save');
      setContent(data.content);
      setJsonDraft(JSON.stringify(data.content, null, 2));
    } catch (e) {
      setError(e.message);
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
              >{saving ? 'Saving...' : 'Save Slides & Testimonials'}</button>
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
                  <li key={i}><span className="font-medium">{t.key}:</span> {t.value}</li>
                ))}
              </ul>
            </div>

            {/* Packages */}
            <div>
              <h3 className="font-semibold">Packages</h3>
              <ul className="text-sm space-y-2">
                {(content?.packages || []).slice(0, 5).map((p, i) => (
                  <li key={i} className="border rounded p-2">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-gray-600">{p.price} <span className="line-through">{p.oldPrice}</span></div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonials Preview */}
            <div>
              <h3 className="font-semibold">Hear from Our Success Stories</h3>
              <ul className="text-sm space-y-2">
                {(content?.testimonials || []).map((t, i) => (
                  <li key={i} className="border rounded p-2">
                    <div className="font-medium">{t.author} {t.role ? `- ${t.role}` : ''}</div>
                    <div className="text-gray-700">{t.text?.slice(0, 120)}{(t.text?.length || 0) > 120 ? '…' : ''}</div>
                    <div className="text-yellow-500 text-xs">Rating: {t.rating || 0}/5</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


