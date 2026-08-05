'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

function getMaterialTypeLabel(material) {
  const mime = String(material?.mimeType || '').toLowerCase();
  const name = String(material?.fileName || material?.fileUrl || '').toLowerCase();
  if (mime.includes('zip') || name.endsWith('.zip')) return 'ZIP';
  return 'PDF';
}

function isAllowedDocument(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return (
    type === 'application/pdf' ||
    name.endsWith('.pdf') ||
    type.includes('zip') ||
    name.endsWith('.zip')
  );
}

export default function CourseMaterialsPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id;

  const [courseTitle, setCourseTitle] = useState('');
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    isFreePreview: false,
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchMaterials();
  }, [router, courseId]);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/courses/${courseId}/materials`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCourseTitle(data.courseTitle || '');
        setMaterials(data.materials || []);
      } else {
        alert('Error loading materials');
      }
    } catch (error) {
      console.error(error);
      alert('Error loading materials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a PDF or ZIP file');
      return;
    }
    if (!isAllowedDocument(selectedFile)) {
      alert('Only PDF and ZIP files are allowed');
      return;
    }
    if (!form.title.trim()) {
      alert('Please enter a title (e.g. Hindi Typing Lesson 1 Notes)');
      return;
    }

    setIsUploading(true);
    try {
      const token = localStorage.getItem('adminToken');

      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      const uploadRes = await fetch('/api/admin/upload-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadData,
      });
      const uploadResult = await uploadRes.json();
      if (!uploadRes.ok || !uploadResult.success) {
        throw new Error(uploadResult.message || 'File upload failed');
      }

      const saveRes = await fetch(`/api/admin/courses/${courseId}/materials`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          fileUrl: uploadResult.url,
          fileName: uploadResult.originalName || selectedFile.name,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimeType,
          isFreePreview: form.isFreePreview,
        }),
      });
      const saveResult = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveResult.error || 'Failed to save file');
      }

      setForm({ title: '', description: '', isFreePreview: false });
      setSelectedFile(null);
      e.target.reset?.();
      fetchMaterials();
      alert('File added successfully!');
    } catch (error) {
      alert(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId, title) => {
    if (!confirm(`Remove "${title}" from this course?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `/api/admin/courses/${courseId}/materials?materialId=${materialId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        fetchMaterials();
      } else {
        const err = await response.json();
        alert(err.error || 'Delete failed');
      }
    } catch (error) {
      alert('Delete failed');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href={`/admin/courses/${courseId}/edit`} className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Course Materials</h1>
              <p className="text-sm text-gray-500">{courseTitle}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/courses/${courseId}/videos`}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Manage Videos
            </Link>
            <Link
              href={`/course/${courseId}`}
              target="_blank"
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View Course
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Add new file</h2>
          <p className="text-sm text-gray-500 mb-6">
            Notes, practice sheets, keyboard layouts (PDF) ya software/fonts/assets (ZIP) yahan upload karein.
            Purchased students ko course page par download milega.
          </p>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Hindi Typing - Lesson 1 Notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Short description (optional)</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Kruti Dev keyboard practice"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF or ZIP) *</label>
              <input
                type="file"
                accept=".pdf,application/pdf,.zip,application/zip,application/x-zip-compressed"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">Max 20MB. PDF ya ZIP allowed.</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isFreePreview}
                onChange={(e) => setForm((p) => ({ ...p, isFreePreview: e.target.checked }))}
                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              Free preview — bina purchase ke bhi download ho (sample notes)
            </label>
            <button
              type="submit"
              disabled={isUploading}
              className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium"
            >
              {isUploading ? 'Uploading…' : 'Upload file'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Uploaded files ({materials.length})
          </h2>
          {materials.length === 0 ? (
            <p className="text-gray-500 text-sm">Abhi koi file nahi hai. Upar se pehli PDF ya ZIP add karein.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {materials.map((m) => (
                <li key={m._id} className="py-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {getMaterialTypeLabel(m)}
                      </span>
                      {m.title}
                    </p>
                    {m.description && (
                      <p className="text-sm text-gray-500 mt-0.5">{m.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatSize(m.fileSize)}
                      {m.isFreePreview && (
                        <span className="ml-2 text-green-700 font-medium">Free preview</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDelete(m._id, m.title)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
