"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FiArrowLeft, FiClock, FiEye } from "react-icons/fi";
import AnimatedSection from "@/app/components/ui/AnimatedSection";
import EmptyState from "@/app/components/ui/EmptyState";
import PrimaryButton from "@/app/components/ui/PrimaryButton";

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

      const response = await fetch(`/api/blogs/${slug}`);

      if (response.ok) {
        const data = await response.json();
        setBlog(data.blog);
      } else if (response.status === 404) {
        setError("Blog post not found");
      } else {
        setError("Error loading blog post");
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      setError("Error loading blog post");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent mx-auto mb-4" />
          <p className="text-slate-600">Loading article…</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <EmptyState
          title="Article not found"
          description={error || "This blog post may have been removed or the link is incorrect."}
          actionLabel="Back to Blog"
          actionHref="/blog"
        />
      </div>
    );
  }

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : `https://www.digitalcareercenter.com/blog/${blog.slug}`;

  return (
    <>
      <Head>
        <title>{blog.title} | Digital Career Center</title>
        <meta name="description" content={blog.excerpt} />
        <meta name="keywords" content={blog.tags?.join(", ") || ""} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={blog.excerpt} />
        <meta property="og:image" content={blog.featuredImage} />
        <meta property="og:url" content={`https://www.digitalcareercenter.com/blog/${blog.slug}`} />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:title" content={blog.title} />
        <meta property="twitter:description" content={blog.excerpt} />
        <meta property="twitter:image" content={blog.featuredImage} />
        <meta property="article:published_time" content={blog.publishedAt} />
        <meta property="article:author" content={blog.author?.name || "Digital Career Center"} />
        <meta property="article:section" content={blog.category} />
        {blog.tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
      </Head>

      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-slate-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-5 lg:px-6 py-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Blog
            </Link>
          </div>
        </nav>

        <AnimatedSection className="max-w-7xl w-full mx-auto px-4 sm:px-5 lg:px-6 py-8 md:py-12">
          <article className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="relative h-56 sm:h-72 md:h-96 bg-slate-100">
              <Image
                src={blog.featuredImage}
                alt={blog.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              {blog.category && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {blog.category}
                </span>
              )}
            </div>

            <div className="p-6 sm:p-10 md:p-12">
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6">
                {blog.readingTime && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiClock className="w-4 h-4" />
                    {blog.readingTime} min read
                  </span>
                )}
                {blog.viewCount != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiEye className="w-4 h-4" />
                    {blog.viewCount} views
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-[2.75rem] font-bold text-slate-900 mb-5 tracking-tight leading-tight">
                {blog.title}
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 mb-8 leading-relaxed border-b border-slate-100 pb-8">
                {blog.excerpt}
              </p>

              <div className="flex items-center gap-4 mb-10 pb-10 border-b border-slate-100">
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-lg">
                    {(blog.author?.name || "DCC")[0]}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {blog.author?.name || "Digital Career Center"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div
                className="blog-article-body prose prose-lg prose-slate max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900
                  prose-h1:text-4xl prose-h1:mt-10 prose-h1:mb-4
                  prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-3
                  prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-2
                  prose-p:text-lg prose-p:leading-relaxed prose-p:text-slate-700 prose-p:mb-5
                  prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
                  prose-strong:text-slate-900 prose-li:text-slate-700 prose-li:my-1
                  prose-img:rounded-xl prose-img:shadow-md prose-img:my-8
                  prose-blockquote:border-l-red-500 prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:text-slate-600
                  prose-code:text-red-700 prose-code:bg-red-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />

              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                  Share this article
                </h3>
                <div className="flex flex-wrap gap-3">
                  <PrimaryButton
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(shareUrl)}`}
                    variant="secondary"
                    size="sm"
                    external
                  >
                    Twitter
                  </PrimaryButton>
                  <PrimaryButton
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    variant="secondary"
                    size="sm"
                    external
                  >
                    Facebook
                  </PrimaryButton>
                  <PrimaryButton
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                    variant="secondary"
                    size="sm"
                    external
                  >
                    LinkedIn
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </article>
        </AnimatedSection>

        <AnimatedSection className="max-w-7xl w-full mx-auto px-4 sm:px-5 lg:px-6 pb-16" delay={0.1}>
          <div className="text-center">
            <PrimaryButton href="/blog" variant="secondary">
              ← Browse all articles
            </PrimaryButton>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
};

export default BlogDetailPage;
