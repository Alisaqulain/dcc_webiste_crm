'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import ServiceEnquiryForm from '@/app/components/services/ServiceEnquiryForm';
import PrimaryButton from '@/app/components/ui/PrimaryButton';
import { mergeSectionItems } from '@/app/components/services/servicePageUtils';

const DEFAULT_PHONE = '+917599863007';
const DEFAULT_PHONE_DISPLAY = '+91-7599863007';

const EASE = [0.22, 1, 0.36, 1];

const STATS = [
  { value: '500+', label: 'Projects delivered' },
  { value: '8+', label: 'Years experience' },
  { value: '24h', label: 'Response time' },
  { value: '100%', label: 'Client focus' },
];

const PROCESS = [
  { step: '01', title: 'Free consultation', desc: 'We understand your goals, audience & current presence.' },
  { step: '02', title: 'Custom strategy', desc: 'Tailored plan with clear milestones and KPIs.' },
  { step: '03', title: 'Execute & grow', desc: 'We manage, optimize and report — you see real results.' },
];

const FEATURE_ICONS = ['📈', '🎯', '⚡', '🛡️', '💡', '🚀'];

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: EASE },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

function getImg(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
}

function Reveal({ children, className = '', delay = 0 }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function HeroImage({ src, alt }) {
  if (!src) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-slate-800 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-28 h-28 rounded-full border-2 border-red-400/40 flex items-center justify-center text-red-300/60 text-4xl font-black"
        >
          DCC
        </motion.div>
      </div>
    );
  }
  if (src.startsWith('data:')) {
    return <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />;
  }
  return <Image src={src} alt={alt} fill className="object-cover" unoptimized priority />;
}

function ServiceCard({ item, index }) {
  return (
    <motion.li
      variants={fadeUp}
      custom={index % 6}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-red-100/40 hover:border-red-200/80 transition-colors duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-red-50/0 to-red-50/0 group-hover:from-red-50/80 group-hover:to-transparent transition-all duration-300 pointer-events-none" />
      <span className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-red-500/30 group-hover:scale-110 transition-transform duration-300">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="relative text-slate-800 text-sm sm:text-[15px] font-semibold leading-snug">{item}</span>
    </motion.li>
  );
}

function ServiceCardGrid({ items, listHeading }) {
  return (
    <div className="w-full">
      {listHeading && (
        <Reveal className="mb-8 md:mb-10">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{listHeading}</h3>
          <div className="mt-3 h-1 w-12 rounded-full bg-gradient-to-r from-red-500 to-red-400" />
        </Reveal>
      )}
      <motion.ul
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
      >
        {items.map((item, i) => (
          <ServiceCard key={`${item}-${i}`} item={item} index={i} />
        ))}
      </motion.ul>
    </div>
  );
}

function TaglineBanner({ text }) {
  if (!text) return null;
  return (
    <Reveal delay={0.15}>
      <div className="relative mt-12 md:mt-16 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 px-6 py-8 sm:px-10 sm:py-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.2),transparent_70%)] pointer-events-none" />
        <motion.p
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative text-lg sm:text-xl md:text-2xl font-bold text-white leading-relaxed"
        >
          {text}
        </motion.p>
      </div>
    </Reveal>
  );
}

function SectionImage({ src, alt = '' }) {
  if (!src) return null;
  return (
    <Reveal>
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/40 ring-1 ring-slate-200/80 group">
        {src.startsWith('data:') ? (
          <img src={src} alt={alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
        ) : (
          <Image src={src} alt={alt} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent pointer-events-none" />
      </div>
    </Reveal>
  );
}

function ServiceContentSection({ section, idx }) {
  const merged = mergeSectionItems(section);
  const imageSrc = getImg(section.image);
  const hasImage = Boolean(imageSrc);
  const hasTitle = Boolean(section.title?.trim());
  const isEven = idx % 2 === 0;
  const bgClass = isEven ? 'bg-slate-50' : 'bg-white';

  if (merged.hasListContent) {
    return (
      <section className={`w-full py-14 md:py-20 ${bgClass} relative overflow-hidden`}>
        {isEven && (
          <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-red-100/40 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4" />
        )}

        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12">
          {/* Intro row: text + optional image side by side */}
          <div className={`grid grid-cols-1 ${hasImage ? 'lg:grid-cols-2' : ''} gap-8 lg:gap-12 mb-12 md:mb-14 items-center`}>
            <Reveal className={hasImage ? '' : 'max-w-4xl'}>
              {hasTitle && (
                <>
                  <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-red-600 mb-3">
                    {String(idx + 1).padStart(2, '0')} · {section.title}
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight mb-4">
                    {section.title}
                  </h2>
                  <div className="h-1 w-14 rounded-full bg-gradient-to-r from-red-500 to-red-400 mb-5" />
                </>
              )}
              {merged.intro && (
                <p className="text-slate-600 text-base sm:text-lg leading-relaxed">{merged.intro}</p>
              )}
            </Reveal>

            {hasImage && (
              <div className="w-full">
                <SectionImage src={imageSrc} alt={section.title || ''} />
              </div>
            )}
          </div>

          {/* Full-width services card grid */}
          <div className="w-full rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-xl shadow-slate-200/50 p-5 sm:p-8 md:p-10">
            <ServiceCardGrid
              items={merged.bullets}
              listHeading={
                merged.listHeading && merged.listHeading !== section.title
                  ? merged.listHeading
                  : hasTitle
                    ? ''
                    : merged.listHeading || 'Our Services'
              }
            />
          </div>

          <TaglineBanner text={merged.tagline} />
        </div>
      </section>
    );
  }

  if (hasImage) {
    return (
      <section className={`w-full py-16 md:py-24 ${bgClass}`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal className={!isEven ? 'lg:order-2' : ''}>
              {hasTitle && (
                <>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 mb-3 block">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5 leading-snug">{section.title}</h2>
                </>
              )}
              {merged.intro && (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">{merged.intro}</p>
              )}
              <TaglineBanner text={merged.tagline} />
            </Reveal>
            <div className={!isEven ? 'lg:order-1' : ''}>
              <SectionImage src={imageSrc} alt={section.title || ''} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full py-16 md:py-24 ${bgClass}`}>
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Reveal>
          {hasTitle && (
            <>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600 mb-3 block">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-5">{section.title}</h2>
              <div className="h-1 w-14 rounded-full bg-gradient-to-r from-red-500 to-red-400 mx-auto mb-6" />
            </>
          )}
          {merged.intro && (
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">{merged.intro}</p>
          )}
          <TaglineBanner text={merged.tagline} />
        </Reveal>
      </div>
    </section>
  );
}

export default function ServiceDetailPage() {
  const params = useParams();
  const slug = params?.slug;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reduce = useReducedMotion();

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent"
        />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-slate-600">Service not found.</p>
        <Link href="/services" className="text-red-600 font-semibold hover:underline">← All services</Link>
      </div>
    );
  }

  const phone = service.phone?.replace(/\s/g, '') || DEFAULT_PHONE;
  const phoneDisplay = service.phone || DEFAULT_PHONE_DISPLAY;
  const heroImg = getImg(service.image);
  const title = service.heroTitle || service.title;

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-slate-950 text-white overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={reduce ? {} : { x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-red-600/25 rounded-full blur-[100px]"
          />
          <motion.div
            animate={reduce ? {} : { x: [0, -25, 0], y: [0, 25, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-red-900/20 rounded-full blur-[90px]"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(220,38,38,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,rgba(15,23,42,0.8))]" />
        </div>

        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full transition-all mb-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All services
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div variants={stagger} initial="hidden" animate="visible">
              <motion.span variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-red-400 bg-red-500/10 border border-red-500/25 px-4 py-2 rounded-full mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                {service.title}
              </motion.span>

              <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-white">
                {title}
              </motion.h1>

              {(service.heroSubtitle || service.shortDescription) && (
                <motion.p variants={fadeUp} custom={2} className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl">
                  {service.heroSubtitle || service.shortDescription}
                </motion.p>
              )}

              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-col sm:flex-row gap-4">
                <PrimaryButton href={`tel:${phone}`} size="lg" className="shadow-xl shadow-red-600/30 w-full sm:w-auto justify-center">
                  Call {phoneDisplay}
                </PrimaryButton>
                <PrimaryButton href="#enquire" variant="secondary" size="lg" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/15 backdrop-blur-sm w-full sm:w-auto justify-center">
                  Free consultation
                </PrimaryButton>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
                <HeroImage src={heroImg} alt={service.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="absolute -bottom-5 -left-2 sm:-bottom-6 sm:-left-6 bg-white text-slate-900 rounded-2xl shadow-2xl px-6 py-4 hidden sm:block"
              >
                <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Talk to experts</p>
                <p className="text-xl font-bold mt-0.5">{phoneDisplay}</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="relative z-10 -mt-8 mx-4 sm:mx-6 lg:mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200/80 rounded-2xl overflow-hidden shadow-xl shadow-slate-900/10 ring-1 ring-slate-200/80"
        >
          {STATS.map((s, i) => (
            <div key={s.label} className="bg-white px-4 sm:px-6 py-6 sm:py-8 text-center hover:bg-red-50/30 transition-colors">
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="text-2xl sm:text-3xl font-bold text-red-600"
              >
                {s.value}
              </motion.p>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* FEATURES */}
      {service.features?.length > 0 && (
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">What we offer</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                Everything you need to grow online
              </h2>
            </Reveal>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
            >
              {service.features.map((f, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ y: -6 }}
                  className="group p-7 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 hover:border-red-200 hover:shadow-xl hover:shadow-red-100/30 transition-all duration-300"
                >
                  <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform duration-300 inline-block">
                    {FEATURE_ICONS[i % FEATURE_ICONS.length]}
                  </span>
                  <p className="font-bold text-lg text-slate-900 group-hover:text-red-700 transition-colors">{f.title}</p>
                  {f.description && <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.description}</p>}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* CONTENT SECTIONS */}
      {service.sections?.map((section, idx) => (
        <ServiceContentSection key={idx} section={section} idx={idx} />
      ))}

      {/* PROCESS */}
      <section className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(220,38,38,0.12),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">How it works</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Simple 3-step process</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.12}>
                <div className="relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300 h-full">
                  <span className="text-5xl font-black text-red-500/30">{p.step}</span>
                  <h3 className="text-xl font-bold mt-4 mb-2">{p.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA + FORM */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-slate-100 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">
            <Reveal className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Get started</span>
                <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900 leading-snug">
                  Request a FREE consultation
                </h2>
                <p className="text-slate-600 mt-4 leading-relaxed">
                  Talk to our experts about {service.title}. We&apos;ll study your needs and propose the best plan for your growth.
                </p>
              </div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="p-7 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl shadow-red-600/30"
              >
                <p className="text-red-100 text-sm font-medium">Prefer to call?</p>
                <a href={`tel:${phone}`} className="block text-3xl font-bold mt-1 hover:text-red-100 transition-colors">
                  {phoneDisplay}
                </a>
                <p className="text-red-200/80 text-sm mt-3">Mon–Sat · Quick response</p>
                <PrimaryButton href={`tel:${phone}`} size="md" className="mt-5 !bg-white !text-red-700 hover:!bg-red-50 w-full">
                  Call now
                </PrimaryButton>
              </motion.div>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-3">
              <div className="rounded-3xl bg-white p-6 sm:p-8 lg:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100">
                <ServiceEnquiryForm serviceSlug={service.slug} serviceTitle={service.title} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 p-3 flex gap-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <a href={`tel:${phone}`} className="flex-1 dcc-btn-primary dcc-btn-md justify-center">Call now</a>
        <a href="#enquire" className="flex-1 dcc-btn-secondary dcc-btn-md justify-center">Enquire</a>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}
