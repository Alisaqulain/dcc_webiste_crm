'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminCombosPage() {
  const router = useRouter();
  const [combos, setCombos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    thumbnail: '',
    banner: '',
    viewMore: '',
    courseIds: [],
    hasCrmAccess: false,
    isPublished: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  });

  const load = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    setLoading(true);
    try {
      const [cRes, crRes] = await Promise.all([
        fetch('/api/admin/combos', { headers: authHeaders() }),
        fetch('/api/admin/courses?limit=0', { headers: authHeaders() }),
      ]);
      const cData = await cRes.json();
      const crData = await crRes.json();
      if (cRes.ok) setCombos(cData.combos || []);
      if (crRes.ok) setCourses(crData.courses || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [router]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, GIF, WebP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB');
      return;
    }
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(
          (data.message || 'Upload failed') +
            (data.hint ? `\n\n${data.hint}` : '')
        );
        return;
      }
      setUploadedImage(data.url);
      setForm((f) => ({ ...f, thumbnail: data.url }));
      if (data.warning) {
        console.warn('Upload warning:', data.warning);
      }
    } catch (err) {
      alert('Upload failed: ' + (err.message || 'network error'));
    } finally {
      setIsUploading(false);
    }
  };

  const togglePublished = async (combo) => {
    const res = await fetch(`/api/admin/combos/${combo._id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({
        ...combo,
        courseIds: (combo.courseIds || []).map((c) => c._id || c),
        isPublished: combo.isPublished === false,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed to update');
      return;
    }
    load();
  };

  const toggleCourse = (id) => {
    const sid = String(id);
    setForm((f) => ({
      ...f,
      courseIds: f.courseIds.includes(sid)
        ? f.courseIds.filter((x) => x !== sid)
        : [...f.courseIds, sid],
    }));
  };

  const createCombo = async (e) => {
    e.preventDefault();
    if (form.courseIds.length < 2) {
      alert('Select at least 2 courses');
      return;
    }
    if (!form.thumbnail) {
      alert('Upload a thumbnail image');
      return;
    }
    const res = await fetch('/api/admin/combos', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed');
      return;
    }
    alert(
      form.isPublished
        ? 'Combo created and published. Open /courses on the website (Ctrl+F5) to see it.'
        : 'Combo saved as draft. Check "Published on website" and create again, or use Publish on the list below.'
    );
    setForm({
      title: '',
      description: '',
      shortDescription: '',
      price: '',
      originalPrice: '',
      thumbnail: '',
      banner: '',
      viewMore: '',
      courseIds: [],
      hasCrmAccess: false,
      isPublished: true,
    });
    setUploadedImage(null);
    load();
  };

  const removeCombo = async (id) => {
    if (!confirm('Delete this combo? It will be removed from the Courses page immediately.')) return;
    const res = await fetch(`/api/admin/combos/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.message || 'Delete failed. Check you are logged in as admin.');
      return;
    }
    alert('Combo deleted. Refresh the Courses page on the website (hard refresh: Ctrl+F5).');
    load();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Combo courses</h1>
      <p className="text-sm text-gray-600 mb-6">
        Bundle multiple courses at one price. Students checkout at{' '}
        <code className="bg-gray-100 px-1 rounded">/purchase/combo/[id]</code>.
      </p>

      <form onSubmit={createCombo} className="bg-white border rounded-lg p-4 mb-8 space-y-3">
        <h2 className="font-semibold">Create combo</h2>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Short description (card)"
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Price (INR)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Original price (optional)"
            value={form.originalPrice}
            onChange={(e) => setForm({ ...form, originalPrice: e.target.value })}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Thumbnail image *</p>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-sm" />
          {isUploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
          {(uploadedImage || form.thumbnail) && (
            <img
              src={uploadedImage || form.thumbnail}
              alt="Preview"
              className="mt-2 h-32 w-auto rounded border object-cover"
            />
          )}
        </div>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Banner text (optional)"
          value={form.banner}
          onChange={(e) => setForm({ ...form, banner: e.target.value })}
        />
        <textarea
          className="w-full border rounded px-3 py-2"
          placeholder="View more content (HTML/text)"
          rows={4}
          value={form.viewMore}
          onChange={(e) => setForm({ ...form, viewMore: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.hasCrmAccess}
            onChange={(e) => setForm({ ...form, hasCrmAccess: e.target.checked })}
          />
          Includes CRM access
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
          />
          Published on website (Courses page &amp; signup)
        </label>
        <div>
          <p className="text-sm font-medium mb-2">Courses in bundle (min 2)</p>
          <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
            {courses.map((c) => (
              <label key={c._id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.courseIds.includes(String(c._id))}
                  onChange={() => toggleCourse(c._id)}
                />
                {c.title} — ₹{c.price}
              </label>
            ))}
          </div>
        </div>
        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          Create combo
        </button>
      </form>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="space-y-4">
          {combos.map((combo) => (
            <div key={combo._id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{combo.title}</h3>
                  <p className="text-sm text-gray-600">₹{combo.price}</p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      combo.isPublished !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {combo.isPublished !== false ? 'Live on website' : 'Hidden (draft)'}
                  </span>
                  <ul className="text-xs text-gray-500 mt-2">
                    {(combo.courseIds || []).map((c) => (
                      <li key={c._id}>• {c.title}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={`/purchase/combo/${combo._id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Preview checkout
                  </a>
                  <button
                    type="button"
                    onClick={() => togglePublished(combo)}
                    className="text-sm text-gray-700 hover:underline text-left"
                  >
                    {combo.isPublished !== false ? 'Unpublish' : 'Publish on website'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCombo(combo._id)}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
          {combos.length === 0 && <p className="text-gray-500">No combos yet.</p>}
        </div>
      )}
    </div>
  );
}
