'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function getImg(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
}

const emptySection = () => ({ title: '', content: '', image: '', bullets: '' });
const emptyFeature = () => ({ title: '', description: '' });

export default function AdminServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [uploadingField, setUploadingField] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    heroTitle: '',
    heroSubtitle: '',
    image: '',
    phone: '',
    sections: [emptySection()],
    features: [emptyFeature()],
    isPublished: true,
    showInHeader: true,
    order: 0,
  });

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
      const res = await fetch('/api/admin/services', { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setServices(data.services || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [router]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      title: '',
      slug: '',
      shortDescription: '',
      heroTitle: '',
      heroSubtitle: '',
      image: '',
      phone: '',
      sections: [emptySection()],
      features: [emptyFeature()],
      isPublished: true,
      showInHeader: true,
      order: 0,
    });
  };

  const uploadImage = async (file, onDone) => {
    if (!file?.type.startsWith('image/')) {
      alert('Select an image');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Upload failed');
    onDone(data.url);
  };

  const startEdit = (service) => {
    setEditing(service._id);
    setForm({
      title: service.title || '',
      slug: service.slug || '',
      shortDescription: service.shortDescription || '',
      heroTitle: service.heroTitle || '',
      heroSubtitle: service.heroSubtitle || '',
      image: service.image || '',
      phone: service.phone || '',
      sections: (service.sections?.length ? service.sections : [emptySection()]).map((s) => ({
        title: s.title || '',
        content: s.content || '',
        image: s.image || '',
        bullets: (s.bullets || []).join('\n'),
      })),
      features: (service.features?.length ? service.features : [emptyFeature()]).map((f) => ({
        title: f.title || '',
        description: f.description || '',
      })),
      isPublished: service.isPublished !== false,
      showInHeader: service.showInHeader !== false,
      order: service.order || 0,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPayload = () => ({
    title: form.title.trim(),
    slug: form.slug.trim() || undefined,
    shortDescription: form.shortDescription.trim(),
    heroTitle: form.heroTitle.trim() || form.title.trim(),
    heroSubtitle: form.heroSubtitle.trim(),
    image: form.image.trim(),
    phone: form.phone.trim(),
    sections: form.sections
      .filter((s) => s.title.trim() || s.content.trim())
      .map((s) => ({
        title: s.title.trim(),
        content: s.content.trim(),
        image: s.image.trim(),
        bullets: s.bullets.split('\n').map((b) => b.trim()).filter(Boolean),
      })),
    features: form.features
      .filter((f) => f.title.trim())
      .map((f) => ({ title: f.title.trim(), description: f.description.trim() })),
    isPublished: form.isPublished,
    showInHeader: form.showInHeader,
    order: Number(form.order) || 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    const payload = buildPayload();
    const url = editing ? `/api/admin/services/${editing}` : '/api/admin/services';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || 'Failed');
      return;
    }
    resetForm();
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: 'DELETE', headers: authHeaders() });
    if (res.ok) load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">SEO, SMO, website management — shown in header dropdown & service pages.</p>
        </div>
        <Link href="/admin/service-inquiries" className="text-sm text-red-600 font-medium hover:underline">
          View enquiries →
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-5 max-w-4xl">
        <h2 className="font-semibold">{editing ? 'Edit service' : 'Add service'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Service title * (e.g. SEO)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="URL slug (optional, auto from title)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm" placeholder="Phone for this service (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Short description (header / listing)" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
          <input className="border rounded-lg px-3 py-2 text-sm sm:col-span-2" placeholder="Hero title" value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} />
          <textarea className="border rounded-lg px-3 py-2 text-sm sm:col-span-2 min-h-[70px]" placeholder="Hero subtitle" value={form.heroSubtitle} onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })} />
          <input type="number" className="border rounded-lg px-3 py-2 text-sm" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Published</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.showInHeader} onChange={(e) => setForm({ ...form, showInHeader: e.target.checked })} /> Show in header dropdown</label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Hero image</label>
          <input type="file" accept="image/*" disabled={!!uploadingField} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploadingField('hero');
            try {
              await uploadImage(file, (url) => setForm((p) => ({ ...p, image: url })));
            } catch (err) { alert(err.message); }
            finally { setUploadingField(''); }
          }} className="text-sm" />
          {getImg(form.image) && (
            <div className="mt-2 relative w-32 h-20 rounded border overflow-hidden">
              <Image src={getImg(form.image)} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Content sections</h3>
            <button type="button" className="text-xs text-red-600" onClick={() => setForm({ ...form, sections: [...form.sections, emptySection()] })}>+ Add section</button>
          </div>
          {form.sections.map((sec, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-2 bg-gray-50">
              <input className="border rounded px-3 py-2 text-sm w-full" placeholder="Section title" value={sec.title} onChange={(e) => {
                const sections = [...form.sections];
                sections[idx] = { ...sections[idx], title: e.target.value };
                setForm({ ...form, sections });
              }} />
              <textarea className="border rounded px-3 py-2 text-sm w-full min-h-[80px]" placeholder="Section content" value={sec.content} onChange={(e) => {
                const sections = [...form.sections];
                sections[idx] = { ...sections[idx], content: e.target.value };
                setForm({ ...form, sections });
              }} />
              <textarea className="border rounded px-3 py-2 text-sm w-full min-h-[60px]" placeholder="Bullet points (one per line)" value={sec.bullets} onChange={(e) => {
                const sections = [...form.sections];
                sections[idx] = { ...sections[idx], bullets: e.target.value };
                setForm({ ...form, sections });
              }} />
              <input type="file" accept="image/*" className="text-xs" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await uploadImage(file, (url) => {
                    const sections = [...form.sections];
                    sections[idx] = { ...sections[idx], image: url };
                    setForm({ ...form, sections });
                  });
                } catch (err) { alert(err.message); }
              }} />
              {form.sections.length > 1 && (
                <button type="button" className="text-xs text-red-600" onClick={() => setForm({ ...form, sections: form.sections.filter((_, i) => i !== idx) })}>Remove section</button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Feature highlights</h3>
            <button type="button" className="text-xs text-red-600" onClick={() => setForm({ ...form, features: [...form.features, emptyFeature()] })}>+ Add feature</button>
          </div>
          {form.features.map((feat, idx) => (
            <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="border rounded px-3 py-2 text-sm" placeholder="Feature title" value={feat.title} onChange={(e) => {
                const features = [...form.features];
                features[idx] = { ...features[idx], title: e.target.value };
                setForm({ ...form, features });
              }} />
              <input className="border rounded px-3 py-2 text-sm" placeholder="Feature description" value={feat.description} onChange={(e) => {
                const features = [...form.features];
                features[idx] = { ...features[idx], description: e.target.value };
                setForm({ ...form, features });
              }} />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button type="submit" className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-medium">{editing ? 'Update' : 'Create service'}</button>
          {editing && <button type="button" onClick={resetForm} className="border px-5 py-2 rounded-lg text-sm">Cancel</button>}
        </div>
      </form>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b font-semibold">All services ({services.length})</div>
        <ul className="divide-y">
          {services.map((s) => (
            <li key={s._id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-xs text-gray-500">/services/{s.slug} · {s.isPublished ? 'Live' : 'Draft'} · {s.showInHeader ? 'In header' : 'Hidden from header'}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/services/${s.slug}`} target="_blank" rel="noreferrer" className="text-sm text-gray-600 hover:underline">View</a>
                <button type="button" onClick={() => startEdit(s)} className="text-sm text-blue-600 hover:underline">Edit</button>
                <button type="button" onClick={() => handleDelete(s._id)} className="text-sm text-red-600 hover:underline">Delete</button>
              </div>
            </li>
          ))}
          {services.length === 0 && <li className="p-6 text-sm text-gray-500">No services yet. Add SEO, SMO, etc.</li>}
        </ul>
      </div>
    </div>
  );
}
