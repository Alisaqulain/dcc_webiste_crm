'use client';

import Link from 'next/link';
import AnimatedSection from './AnimatedSection';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-red-50/40">
      <AnimatedSection className="w-full max-w-md">
        <div className="dcc-card overflow-hidden shadow-xl shadow-slate-200/60 border-slate-200/80">
          <div className="relative bg-gradient-to-br from-red-600 via-red-600 to-red-800 px-6 py-9 text-center text-white overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-red-900/30 rounded-full blur-2xl" />
            </div>
            <Link href="/" className="relative inline-flex items-center gap-2 mb-4 group">
              <img
                src="/newlogo.jpeg"
                alt="Digital Career Center"
                width={480}
                height={96}
                className="h-24 sm:h-28 w-auto max-w-[360px] sm:max-w-[440px] object-contain rounded-md bg-white/95 px-2 py-1 shadow-lg group-hover:scale-[1.02] transition-transform duration-300"
              />
            </Link>
            <h1 className="relative text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="relative mt-2 text-red-100/90 text-sm leading-relaxed">{subtitle}</p>}
          </div>
          <div className="p-6 sm:p-8 bg-white">{children}</div>
          {footer && (
            <div className="px-6 sm:px-8 pb-8 text-center text-sm text-slate-600 border-t border-slate-100 pt-6 bg-slate-50/50">
              {footer}
            </div>
          )}
        </div>
      </AnimatedSection>
    </div>
  );
}

export function AuthInput({ label, id, className = '', ...props }) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="dcc-label">
          {label}
        </label>
      )}
      <input id={id} className={`dcc-input bg-slate-50/40 ${className}`} {...props} />
    </div>
  );
}
