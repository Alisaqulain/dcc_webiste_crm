'use client';

import AnimatedSection from './AnimatedSection';

export default function PageHeader({
  eyebrow,
  title,
  description,
  children,
  dark = false,
}) {
  return (
    <AnimatedSection
      className={`relative overflow-hidden ${
        dark
          ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white'
          : 'bg-gradient-to-b from-white to-slate-50/80 border-b border-slate-100'
      }`}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl ${
            dark ? 'bg-red-500/25' : 'bg-red-100/50'
          }`}
        />
        <div
          className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl ${
            dark ? 'bg-white/5' : 'bg-slate-100/60'
          }`}
        />
        {dark && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_50%)]" />
        )}
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-16 text-center">
        {eyebrow && (
          <p
            className={`text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4 ${
              dark ? 'text-red-300' : 'text-red-600'
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-5 ${
            dark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {title}
        </h1>
        {description && (
          <p
            className={`max-w-2xl mx-auto text-base sm:text-lg leading-relaxed ${
              dark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {description}
          </p>
        )}
        {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
      </div>
    </AnimatedSection>
  );
}
