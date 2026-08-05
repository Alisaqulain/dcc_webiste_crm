'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/app/components/ui/PageHeader';

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
        description="Website management, SEO, SMO, digital marketing and advertising — professional solutions for your business."
      >
        <a
          href={`tel:${DEFAULT_PHONE}`}
          className="dcc-btn dcc-btn-md bg-white text-red-700 hover:bg-red-50 shadow-md hover:shadow-lg border border-white/80"
        >
          Call Now
        </a>
        <Link href="/contact" className="dcc-btn-secondary dcc-btn-md !bg-white/10 !text-white !border-white/20">
          Enquire Now
        </Link>
      </PageHeader>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-10">
          Talk to our experts — Call us on{' '}
          <a href={`tel:${DEFAULT_PHONE}`} className="font-semibold text-red-600 hover:text-red-700">
            {DEFAULT_PHONE_DISPLAY}
          </a>
        </p>

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-600">Services coming soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service) => {
              const img = getImg(service.image);
              return (
                <Link
                  key={service._id}
                  href={`/services/${service.slug}`}
                  className="group dcc-card-premium overflow-hidden hover:border-red-200 transition-all hover:-translate-y-1"
                >
                  <div className="relative h-44 bg-gradient-to-br from-slate-800 to-slate-900">
                    {img ? (
                      img.startsWith('data:') ? (
                        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity" />
                      ) : (
                        <Image src={img} alt="" fill className="object-cover opacity-80 group-hover:opacity-90 transition-opacity" unoptimized />
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/30 text-4xl font-bold">
                        {service.title?.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white">
                      {service.title}
                    </h3>
                  </div>
                  <div className="p-5">
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {service.shortDescription || 'Learn more about this service.'}
                    </p>
                    <span className="inline-block mt-4 text-sm font-semibold text-red-600 group-hover:text-red-700">
                      View details →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
