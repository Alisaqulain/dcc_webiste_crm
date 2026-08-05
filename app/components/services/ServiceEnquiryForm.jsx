'use client';

import { useState } from 'react';

export default function ServiceEnquiryForm({ serviceSlug, serviceTitle }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    websiteUrl: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus('');
    try {
      const res = await fetch(`/api/services/${serviceSlug}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', phone: '', websiteUrl: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Contact us now</h2>
        <p className="text-slate-600 mt-1.5 text-sm sm:text-base">
          Request a free consultation{serviceTitle ? ` for ${serviceTitle}` : ''}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="svc-name" className="dcc-label">Full name *</label>
            <input
              id="svc-name"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="dcc-input"
            />
          </div>
          <div>
            <label htmlFor="svc-phone" className="dcc-label">Mobile number</label>
            <input
              id="svc-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="+91 XXXXX XXXXX"
              className="dcc-input"
            />
          </div>
        </div>

        <div>
          <label htmlFor="svc-email" className="dcc-label">Email address *</label>
          <input
            id="svc-email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="dcc-input"
          />
        </div>

        <div>
          <label htmlFor="svc-website" className="dcc-label">Website URL</label>
          <input
            id="svc-website"
            name="websiteUrl"
            type="url"
            value={form.websiteUrl}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            className="dcc-input"
          />
        </div>

        <div>
          <label htmlFor="svc-message" className="dcc-label">Your message</label>
          <textarea
            id="svc-message"
            name="message"
            rows={4}
            value={form.message}
            onChange={handleChange}
            placeholder="Tell us about your project or requirements…"
            className="dcc-input resize-y min-h-[120px]"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="dcc-btn-primary dcc-btn-lg w-full disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending…
            </span>
          ) : (
            'Send message'
          )}
        </button>

        {status === 'success' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
            <span className="text-emerald-600">✓</span>
            Thank you! We will contact you shortly.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            Something went wrong. Please try again or call us directly.
          </div>
        )}
      </form>
    </div>
  );
}
