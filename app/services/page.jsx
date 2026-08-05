'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import PageHeader from '@/app/components/ui/PageHeader';
import PrimaryButton from '@/app/components/ui/PrimaryButton';
import AnimatedSection from '@/app/components/ui/AnimatedSection';

const DEFAULT_PHONE = '+917599863007';
const DEFAULT_PHONE_DISPLAY = '+91-7599863007';

function getImg(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) return url;
  return `/${url}`;
}

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/services', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        dark
        eyebrow="Digital Career Center"
        title="Our Services"
        description="Website management, SEO, SMO, digital marketing and advertising — professional solutions built for growth."
      >
        <PrimaryButton href={`tel:${DEFAULT_PHONE}`} size="md" className="!bg-white !text-red-700 hover:!bg-red-50 shadow-lg">
          Call Now
        </PrimaryButton>
        <PrimaryButton href="/contact" variant="secondary" size="md" className="!bg-white/10 !text-white !border-white/25 hover:!bg-white/15">
          Enquire Now
        </PrimaryButton>
      </PageHeader>

      {/* Trust strip */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-slate-600">
          {['SEO & SMO', 'Website Management', 'Digital Advertising', 'Content Strategy'].map((t) => (
            <span key={t} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {t}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <p className="text-center text-slate-600 max-w-2xl mx-auto mb-12">
          Talk to our experts —{' '}
          <a href={`tel:${DEFAULT_PHONE}`} className="font-semibold text-red-600 hover:text-red-700">
            {DEFAULT_PHONE_DISPLAY}
          </a>
        </p>

        {services.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500">Services coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, idx) => {
              const img = getImg(service.image);
              return (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06, duration: 0.4 }}
                >
                  <Link
                    href={`/services/${service.slug}`}
                    className="group flex flex-col h-full dcc-card-premium overflow-hidden hover:border-red-200/80 hover:shadow-xl hover:shadow-red-100/30 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      {img ? (
                        img.startsWith('data:') ? (
                          <img
                            src={img}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-red-950 flex items-center justify-center">
                          <span className="text-4xl font-black text-white/20">{service.title?.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-xl font-bold text-white group-hover:text-red-100 transition-colors">
                          {service.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-col flex-1 p-5 sm:p-6">
                      <p className="text-sm text-slate-600 line-clamp-3 flex-1 leading-relaxed">
                        {service.shortDescription || 'Professional digital marketing and website solutions.'}
                      </p>
                      <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-red-600 group-hover:text-red-700">
                        View service
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatedSection className="pb-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="dcc-card-premium p-8 sm:p-10 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <h2 className="text-xl sm:text-2xl font-bold">Not sure which service you need?</h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">Book a free call — we&apos;ll recommend the right plan.</p>
            <PrimaryButton href={`tel:${DEFAULT_PHONE}`} size="lg" className="mt-6">
              Call {DEFAULT_PHONE_DISPLAY}
            </PrimaryButton>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
