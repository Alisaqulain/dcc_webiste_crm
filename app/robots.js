import { getSiteUrl } from '@/lib/siteUrl';

export default function robots() {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/crm/',
          '/api/',
          '/profile',
          '/my-courses',
          '/my-apps',
          '/purchase/',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/crm/',
          '/api/',
          '/profile',
          '/my-courses',
          '/my-apps',
          '/purchase/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
