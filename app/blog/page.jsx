"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Head from "next/head";
import { FiSearch } from "react-icons/fi";
import PageHeader from "@/app/components/ui/PageHeader";
import AnimatedSection from "@/app/components/ui/AnimatedSection";
import BlogCard from "@/app/components/ui/BlogCard";
import EmptyState from "@/app/components/ui/EmptyState";
import PrimaryButton from "@/app/components/ui/PrimaryButton";
import SectionTitle from "@/app/components/ui/SectionTitle";

const BlogPage = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    "All",
    "Technology",
    "Digital Marketing",
    "Web Development",
    "Data Science",
    "AI/ML",
    "Business",
    "Education",
    "Career",
    "Other",
  ];

  useEffect(() => {
    fetchBlogs();
  }, [selectedCategory, searchTerm]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: 1,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory !== "All" && { category: selectedCategory }),
      });

      const response = await fetch(`/api/blogs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.blogs);
        const featured = data.blogs.find((blog) => blog.isFeatured);
        setFeaturedPost(featured);
      } else {
        console.error("Error fetching blogs");
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const gridPosts = blogPosts.filter((post) => !post.isFeatured);

  return (
    <>
      <Head>
        <title>Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center</title>
        <meta
          name="description"
          content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center."
        />
        <meta
          name="keywords"
          content="digital career blog, digital marketing tips, SEO insights, web development trends, career development, digital skills blog"
        />
        <meta
          property="og:title"
          content="Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center"
        />
        <meta
          property="og:description"
          content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center."
        />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/newlogo.jpeg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center"
        />
        <meta
          name="twitter:description"
          content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center."
        />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/newlogo.jpeg" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com/blog" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              name: "Digital Career Center Blog",
              description:
                "Stay updated with the latest digital career trends, tips, and insights from Digital Career Center.",
              url: "https://domainisdigitalcareercenter.com/blog",
              publisher: {
                "@type": "EducationalOrganization",
                name: "Digital Career Center",
                url: "https://domainisdigitalcareercenter.com",
              },
              blogPost: blogPosts.map((post) => ({
                "@type": "BlogPosting",
                headline: post.title,
                description: post.excerpt,
                author: {
                  "@type": "Organization",
                  name: post.author?.name || post.author,
                },
                datePublished: post.publishedAt || post.date,
                image: post.featuredImage
                  ? post.featuredImage.startsWith("http")
                    ? post.featuredImage
                    : `https://domainisdigitalcareercenter.com${post.featuredImage}`
                  : undefined,
                url: `https://domainisdigitalcareercenter.com/blog/${post.slug}`,
              })),
            }),
          }}
        />
      </Head>

      <div className="min-h-screen bg-slate-50">
        <PageHeader
          dark
          eyebrow="Insights & Resources"
          title="Digital Career Blog"
          description="Stay updated with the latest trends, tips, and insights in digital careers and technology."
        />

        {featuredPost && (
          <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <SectionTitle
              title="Featured Article"
              subtitle="Our top pick — hand-selected for maximum impact on your career journey."
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="md:flex">
                <div className="md:w-1/2 relative min-h-[16rem] md:min-h-0">
                  <Image
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-full object-cover"
                    unoptimized
                  />
                  <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Featured
                  </span>
                </div>
                <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="bg-red-50 text-red-700 text-xs font-semibold px-3 py-1 rounded-full border border-red-100">
                      {featuredPost.category}
                    </span>
                    {featuredPost.readingTime && (
                      <span className="text-slate-400 text-sm">{featuredPost.readingTime} min read</span>
                    )}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    {featuredPost.title}
                  </h3>
                  <p className="text-slate-600 text-base sm:text-lg mb-6 leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        By {featuredPost.author?.name || "Digital Career Center"}
                      </p>
                      <p className="text-sm text-slate-400">
                        {new Date(featuredPost.publishedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <PrimaryButton href={`/blog/${featuredPost.slug}`} size="md">
                      Read Article
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        )}

        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8" delay={0.05}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Find articles
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
              <div className="lg:col-span-5">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title or keyword…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="lg:col-span-7">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                          : "bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {!loading && (
              <p className="text-sm text-slate-500">
                {gridPosts.length} article{gridPosts.length !== 1 ? "s" : ""} found
                {selectedCategory !== "All" && ` in ${selectedCategory}`}
                {searchTerm && ` matching "${searchTerm}"`}
              </p>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20" delay={0.1}>
          <SectionTitle
            title={loading ? "Loading Articles…" : "Latest Articles"}
            subtitle="Expert insights to help you grow in the digital economy."
          />

          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-red-600 border-t-transparent" />
            </div>
          ) : gridPosts.length === 0 ? (
            <EmptyState
              title="No articles found"
              description={
                searchTerm || selectedCategory !== "All"
                  ? "Try adjusting your search or category filter."
                  : "Check back soon for new content."
              }
              actionLabel={searchTerm || selectedCategory !== "All" ? "Clear filters" : undefined}
              onAction={
                searchTerm || selectedCategory !== "All"
                  ? () => {
                      setSearchTerm("");
                      setSelectedCategory("All");
                    }
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {gridPosts.map((post, index) => (
                <BlogCard key={post._id} post={post} index={index} />
              ))}
            </div>
          )}
        </AnimatedSection>

        <AnimatedSection
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 text-white py-16 md:py-20"
          delay={0.15}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <SectionTitle
              title="Stay Updated"
              subtitle="Get the latest digital career tips and industry insights delivered to your inbox."
              className="[&_h2]:text-white [&_p]:text-slate-300 [&_div]:bg-red-500"
            />
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-2">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 text-sm"
              />
              <PrimaryButton size="lg">Subscribe</PrimaryButton>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </>
  );
};

export default BlogPage;
