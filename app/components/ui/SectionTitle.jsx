'use client';

import { motion } from 'framer-motion';

export default function SectionTitle({
  title,
  subtitle,
  align = 'center',
  className = '',
}) {
  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

  const barAlign =
    align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : '';

  const subtitleAlign =
    align === 'left' ? 'mx-0' : align === 'right' ? 'ml-auto mr-0' : 'mx-auto';

  return (
    <div className={`mb-10 md:mb-12 ${alignClass} ${className}`}>
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 tracking-tight"
      >
        {title}
      </motion.h2>
      <div
        className={`mt-4 h-1 w-14 rounded-full bg-gradient-to-r from-red-500 via-red-600 to-red-400 ${barAlign}`}
      />
      {subtitle && (
        <p
          className={`mt-5 text-slate-600 text-base sm:text-lg max-w-3xl leading-relaxed ${subtitleAlign}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
