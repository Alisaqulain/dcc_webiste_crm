'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import ServiceEnquiryForm from '@/app/components/services/ServiceEnquiryForm';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import PrimaryButton from '@/app/components/ui/PrimaryButton';

const DEFAULT_PHONE = '+917599863007';
const DEFAULT_PHONE_DISPLAY = '+91-7599863007';

const FEATURE_ICONS = ['📈', '🎯', '⚡', '🛡️', '💡', '🚀'];

function getImg(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
}

function HeroImage({ src, alt }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border-2 border-red-500/30 flex items-center justify-center text-red-400/50 text-5xl font-black">
          DCC
        </div>
      </div>
    );
  }
  if (src.startsWith('data:')) {
    return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />;
  }
  return <Image src={src} alt={alt} fill className="object-cover" unoptimized priority />;
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
  const title = service.heroTitle || service.title;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ——— HERO ——— */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] bg-red-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-red-900/15 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(220,38,38,0.12),transparent_55%)]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 lg:pt-12 lg:pb-20">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All services
          </Link>

          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {service.title}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold leading-[1.12] tracking-tight text-white">
                {title}
              </h1>

              {(service.heroSubtitle || service.shortDescription) && (
                <p className="mt-5 text-lg text-slate-300 leading-relaxed max-w-xl">
                  {service.heroSubtitle || service.shortDescription}
                </p>
              )}

              <p className="mt-4 text-slate-400 text-sm max-w-lg">
                Professional website management, marketing &amp; advertising — tailored strategies at competitive costs.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <PrimaryButton href={`tel:${phone}`} size="lg" className="shadow-lg shadow-red-600/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call {phoneDisplay}
                </PrimaryButton>
                <PrimaryButton href="#enquire" variant="secondary" size="lg" className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/15 backdrop-blur-sm">
                  Free consultation
                </PrimaryButton>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Free expert call
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Custom strategy
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  360° management
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/10">
                <HeroImage src={heroImg} alt={service.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              </div>
              <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 bg-white text-slate-900 rounded-2xl shadow-xl px-5 py-4 max-w-[220px] hidden sm:block">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Talk to experts</p>
                <p className="text-lg font-bold mt-0.5">{phoneDisplay}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ——— FEATURES ——— */}
      {service.features?.length > 0 && (
        <AnimatedSection className="py-14 md:py-20 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">What we offer</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Design, Marketing, Advertising &amp; Content
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {service.features.map((f, i) => (
                <div
                  key={i}
                  className="group p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 hover:shadow-md hover:shadow-red-100/50 transition-all duration-300"
                >
                  <span className="text-2xl mb-3 block">{FEATURE_ICONS[i % FEATURE_ICONS.length]}</span>
                  <p className="font-bold text-slate-900 group-hover:text-red-800 transition-colors">{f.title}</p>
                  {f.description && (
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      )}

      {/* ——— CONTENT SECTIONS ——— */}
      {service.sections?.map((section, idx) => (
        <AnimatedSection
          key={idx}
          className={`py-16 md:py-20 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${idx % 2 === 1 ? '' : ''}`}>
              <div className={idx % 2 === 1 ? 'lg:order-2' : ''}>
                {section.title && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-3">
                      {String(idx + 1).padStart(2, '0')}
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5 leading-snug">
                      {section.title}
                    </h2>
                  </>
                )}
                {section.content && (
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                    {section.content}
                  </p>
                )}
                {section.bullets?.length > 0 && (
                  <ul className="mt-6 space-y-3">
                    {section.bullets.map((b, bi) => (
                      <li key={bi} className="flex items-start gap-3 text-slate-700">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold mt-0.5">
                          ✓
                        </span>
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {getImg(section.image) && (
                <div className={`relative ${idx % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl ring-1 ring-slate-200/80">
                    {getImg(section.image).startsWith('data:') ? (
                      <img src={getImg(section.image)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Image src={getImg(section.image)} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </AnimatedSection>
      ))}

      {/* ——— CTA + FORM ——— */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-slate-100 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Get started</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  Request a FREE consultation
                </h2>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  Talk to our experts about {service.title}. We&apos;ll study your needs and propose the best plan for your website and business growth.
                </p>
              </div>

              <div className="dcc-card-premium p-6 bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl shadow-red-600/25">
                <p className="text-red-100 text-sm font-medium">Prefer to call?</p>
                <a href={`tel:${phone}`} className="block text-2xl sm:text-3xl font-bold mt-1 hover:text-red-100 transition-colors">
                  {phoneDisplay}
                </a>
                <p className="text-red-200/80 text-sm mt-3">Available Mon–Sat · Quick response</p>
                <PrimaryButton
                  href={`tel:${phone}`}
                  size="md"
                  className="mt-5 !bg-white !text-red-700 hover:!bg-red-50 w-full sm:w-auto"
                >
                  Call now
                </PrimaryButton>
              </div>

              <ul className="space-y-3 text-sm text-slate-600">
                {['Strategic advice for your niche', 'Transparent pricing', 'No obligation consultation'].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <div className="dcc-card-premium p-6 sm:p-8 lg:p-10 bg-white shadow-xl shadow-slate-200/50 border-slate-200/80">
                <ServiceEnquiryForm
                  serviceSlug={service.slug}
                  serviceTitle={service.title}
                  variant="embedded"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile sticky call bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 flex gap-2 safe-area-pb">
        <a
          href={`tel:${phone}`}
          className="flex-1 dcc-btn-primary dcc-btn-md text-center justify-center"
        >
          Call now
        </a>
        <a
          href="#enquire"
          className="flex-1 dcc-btn-secondary dcc-btn-md text-center justify-center"
        >
          Enquire
        </a>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
