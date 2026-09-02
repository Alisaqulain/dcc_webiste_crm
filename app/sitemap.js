import connectDB from '@/lib/mongodb';
import Course from '@/models/Course';
import Blog from '@/models/Blog';
import Service from '@/models/Service';
import { getSiteUrl } from '@/lib/siteUrl';

export const revalidate = 3600;

function entry(path, { changeFrequency = 'monthly', priority = 0.5, lastModified } = {}) {
  const baseUrl = getSiteUrl();
  return {
    url: path ? `${baseUrl}${path.startsWith('/') ? path : `/${path}`}` : baseUrl,
    lastModified: lastModified || new Date(),
    changeFrequency,
    priority,
  };
}

export default async function sitemap() {
  const staticPages = [
    entry('/', { changeFrequency: 'daily', priority: 1.0 }),
    entry('/courses', { changeFrequency: 'weekly', priority: 0.95 }),
    entry('/apps', { changeFrequency: 'weekly', priority: 0.95 }),
    entry('/services', { changeFrequency: 'weekly', priority: 0.9 }),
    entry('/blog', { changeFrequency: 'weekly', priority: 0.85 }),
    entry('/about', { changeFrequency: 'monthly', priority: 0.8 }),
    entry('/contact', { changeFrequency: 'monthly', priority: 0.8 }),
    entry('/faq', { changeFrequency: 'monthly', priority: 0.7 }),
    entry('/download-app', { changeFrequency: 'monthly', priority: 0.6 }),
    entry('/certificate', { changeFrequency: 'monthly', priority: 0.5 }),
    entry('/idcard', { changeFrequency: 'monthly', priority: 0.5 }),
    entry('/BronzeBundle', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/silver', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/gold', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/platinum', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/Diamond', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/dcc', { changeFrequency: 'monthly', priority: 0.85 }),
    entry('/privacy-policy', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/terms-and-conditions', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/refund-policy', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/disclaimer', { changeFrequency: 'yearly', priority: 0.3 }),
    entry('/cookie-policy', { changeFrequency: 'yearly', priority: 0.3 }),
  ];

  let coursePages = [];
  let servicePages = [];
  let blogPages = [];

  try {
    await connectDB();

    const [courses, services, blogs] = await Promise.all([
      Course.find({ isPublished: true }).select('_id updatedAt listingType').lean(),
      Service.find({ isPublished: true }).select('slug updatedAt').lean(),
      Blog.find({ status: 'published' }).select('slug updatedAt publishedAt').lean(),
    ]);

    coursePages = courses.map((course) =>
      entry(`/course/${course._id}`, {
        changeFrequency: 'weekly',
        priority: course.listingType === 'app' ? 0.75 : 0.8,
        lastModified: course.updatedAt ? new Date(course.updatedAt) : new Date(),
      })
    );

    servicePages = services.map((service) =>
      entry(`/services/${service.slug}`, {
        changeFrequency: 'monthly',
        priority: 0.75,
        lastModified: service.updatedAt ? new Date(service.updatedAt) : new Date(),
      })
    );

    blogPages = blogs.map((blog) =>
      entry(`/blog/${blog.slug}`, {
        changeFrequency: 'weekly',
        priority: 0.65,
        lastModified: blog.updatedAt
          ? new Date(blog.updatedAt)
          : blog.publishedAt
            ? new Date(blog.publishedAt)
            : new Date(),
      })
    );
  } catch (error) {
    console.error('Error building dynamic sitemap entries:', error);
  }

  return [...staticPages, ...servicePages, ...coursePages, ...blogPages];
}
