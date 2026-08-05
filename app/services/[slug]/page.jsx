'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ServiceEnquiryForm from '@/app/components/services/ServiceEnquiryForm';

const DEFAULT_PHONE = '+917599863007';
const DEFAULT_PHONE_DISPLAY = '+91-7599863007';

function getImg(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
}

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/services/${slug}`, { cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.message || 'Not found');
        setService(d.service);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600">Service not found.</p>
        <Link href="/services" className="text-red-600 font-semibold hover:underline">
          ← All services
        </Link>
      </div>
    );
  }

  const phone = service.phone?.replace(/\s/g, '') || DEFAULT_PHONE;
  const phoneDisplay = service.phone || DEFAULT_PHONE_DISPLAY;
  const heroImg = getImg(service.image);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-slate-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-slate-300">Management, Advertising and Marketing for Website</span>
          <div className="flex items-center gap-3">
            <a href={`tel:${phone}`} className="font-semibold hover:text-red-300 transition-colors">
              Call Now
            </a>
            <a href="#enquire" className="text-red-400 hover:text-red-300 font-semibold">
              Enquire Now
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {heroImg && (
            heroImg.startsWith('data:') ? (
              <img src={heroImg} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image src={heroImg} alt="" fill className="object-cover" unoptimized />
            )
          )}
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <Link href="/services" className="text-sm text-white/70 hover:text-white mb-6 inline-block">
            ← All services
          </Link>
          <p className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-3">
            {service.title}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold max-w-4xl leading-tight">
            {service.heroTitle || service.title}
          </h1>
          {service.heroSubtitle && (
            <p className="mt-4 text-lg text-slate-300 max-w-3xl leading-relaxed">
              {service.heroSubtitle}
            </p>
          )}
          <p className="mt-6 text-slate-400 max-w-2xl">
            We optimize the costs for the realization of your site.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`tel:${phone}`} className="dcc-btn-primary dcc-btn-md !bg-red-600 hover:!bg-red-500">
              Call {phoneDisplay}
            </a>
            <a href="#enquire" className="dcc-btn-secondary dcc-btn-md !border-white/30 !text-white hover:!bg-white/10">
              Request free consultation
            </a>
          </div>
        </div>
      </section>

      {/* Features strip */}
      {service.features?.length > 0 && (
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
              Website Management: Design, Marketing, Advertising and Content
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {service.features.map((f, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-900">{f.title}</p>
                  {f.description && <p className="text-sm text-slate-600 mt-1">{f.description}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content sections */}
      {service.sections?.map((section, idx) => (
        <section
          key={idx}
          className={`py-14 md:py-16 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${idx % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                {section.title && (
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">{section.title}</h2>
                )}
                {section.content && (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                )}
                {section.bullets?.length > 0 && (
                  <ul className="mt-6 space-y-2">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-2 text-slate-700">
                        <span className="text-red-600 font-bold mt-0.5">✓</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {getImg(section.image) && (
                <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-lg ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  {getImg(section.image).startsWith('data:') ? (
                    <img src={getImg(section.image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Image src={getImg(section.image)} alt="" fill className="object-cover" unoptimized />
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* CTA + form */}
      <section className="py-16 md:py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 p-8 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100">
            <h2 className="text-2xl font-bold text-slate-900">Request a FREE Call!</h2>
            <p className="text-slate-600 mt-2">Talk to our experts</p>
            <a href={`tel:${phone}`} className="inline-block mt-4 text-2xl font-bold text-red-600 hover:text-red-700">
              Call us on {phoneDisplay}
            </a>
          </div>
          <ServiceEnquiryForm serviceSlug={service.slug} serviceTitle={service.title} />
        </div>
      </section>
    </div>
  );
}
