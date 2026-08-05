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
    <div id="enquire" className="scroll-mt-28">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Contact us now</h2>
        <p className="text-slate-600 mt-2">
          Request a free consultation{serviceTitle ? ` for ${serviceTitle}` : ''}.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">
        <input
          name="name"
          required
          value={form.name}
          onChange={handleChange}
          placeholder="Enter Name"
          className="dcc-input w-full"
        />
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={handleChange}
          placeholder="Enter Email"
          className="dcc-input w-full"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Mobile No."
          className="dcc-input w-full"
        />
        <input
          name="websiteUrl"
          value={form.websiteUrl}
          onChange={handleChange}
          placeholder="Website Url"
          className="dcc-input w-full"
        />
        <textarea
          name="message"
          rows={4}
          value={form.message}
          onChange={handleChange}
          placeholder="Write Message"
          className="dcc-input w-full resize-y min-h-[120px]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="dcc-btn-primary dcc-btn-md w-full disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send message'}
        </button>
        {status === 'success' && (
          <p className="text-center text-green-700 text-sm font-medium">
            Thank you! We will contact you shortly.
          </p>
        )}
        {status === 'error' && (
          <p className="text-center text-red-600 text-sm">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
}
