"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useParams } from "next/navigation";

const BlogDetailPage = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const slug = params.slug;

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching blog with slug:', slug);
      const response = await fetch(`/api/blogs/${slug}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Blog data received:', data);
        setBlog(data.blog);
      } else if (response.status === 404) {
        setError('Blog post not found');
      } else {
        setError('Error loading blog post');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setError('Error loading blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600 mb-8">Blog post not found</p>
          <Link 
            href="/blog"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{blog.title} | Digital Career Center</title>
        <meta name="description" content={blog.excerpt} />
        <meta name="keywords" content={blog.tags?.join(', ') || ''} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt} />
        <meta property="og:image" content={blog.featuredImage} />
        <meta property="og:url" content={`https://domainisdigitalcareercenter.com/blog/${blog.slug}`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={blog.title} />
        <meta property="twitter:description" content={blog.excerpt} />
        <meta property="twitter:image" content={blog.featuredImage} />
        
        {/* Article specific meta */}
        <meta property="article:published_time" content={blog.publishedAt} />
        <meta property="article:author" content={blog.author?.name || 'Digital Career Center'} />
        <meta property="article:section" content={blog.category} />
        {blog.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <Link 
              href="/blog"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              ← Back to Blog
            </Link>
          </div>
        </nav>

        {/* Article Header */}
        <article className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Featured Image */}
            <div className="relative h-64 md:h-96">
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Article Content */}
            <div className="p-8 md:p-12">
              {/* Category and Reading Time */}
              <div className="flex items-center mb-6">
                <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  {blog.category}
                </span>
                <span className="ml-4 text-gray-500 text-sm">
                  {blog.readingTime} min read
                </span>
                <span className="ml-4 text-gray-500 text-sm">
                  {blog.viewCount || 0} views
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {blog.title}
              </h1>

              {/* Excerpt */}
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {blog.excerpt}
              </p>

              {/* Author and Date */}
              <div className="flex items-center mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-lg">
                      {(blog.author?.name || 'DCC')[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-gray-900">
                      {blog.author?.name || 'Digital Career Center'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Article Body */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this article</h3>
                <div className="flex space-x-4">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Twitter
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* This would be populated with related articles */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                More articles coming soon...
              </h3>
              <p className="text-gray-600">
                Check back for more related content!
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default BlogDetailPage;
