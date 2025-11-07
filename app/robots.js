export default function robots() {
  const baseUrl = 'https://domainisdigitalcareercenter.com';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/crm/', '/api/', '/profile', '/my-courses', '/purchase/'],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/crm/', '/api/', '/profile', '/my-courses', '/purchase/'],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

