'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function BlogCard({ post, index = 0 }) {
  const thumb = post.featuredImage || post.image || '/newlogo.jpeg';

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group h-full"
    >
      <Link
        href={`/blog/${post.slug}`}
        className="flex flex-col h-full dcc-card-premium hover:border-red-100/90"
      >
        <div className="relative h-48 bg-slate-100 dcc-image-zoom">
          <Image
            src={thumb}
            alt={post.title}
            fill
            className="object-cover dcc-zoom-target"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          {post.category && (
            <span className="absolute top-3 left-3 dcc-badge-red shadow-md">
              {post.category}
            </span>
          )}
        </div>
        <div className="flex flex-col flex-1 p-5 sm:p-6">
          <time className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
            {post.publishedAt || post.createdAt
              ? new Date(post.publishedAt || post.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
          </time>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors duration-200 line-clamp-2 mb-2">
            {post.title}
          </h3>
          <p className="text-sm text-slate-600 line-clamp-3 flex-1 leading-relaxed">
            {post.excerpt || post.summary || ''}
          </p>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-red-600 group-hover:gap-2 transition-all duration-200">
            Read article <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
