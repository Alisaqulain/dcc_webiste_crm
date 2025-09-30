"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

const BlogPage = () => {
  const blogPosts = [
    {
      id: 1,
      title: "10 Essential Digital Skills for Career Success in 2024",
      excerpt: "Discover the most in-demand digital skills that can transform your career and open new opportunities in the modern workplace.",
      author: "Digital Career Center",
      date: "December 15, 2024",
      readTime: "5 min read",
      category: "Career Tips",
      image: "/banner1.jpg",
      featured: true
    },
    {
      id: 2,
      title: "Complete Guide to Digital Marketing for Beginners",
      excerpt: "Learn the fundamentals of digital marketing and how to create effective campaigns that drive results for your business.",
      author: "Marketing Team",
      date: "December 12, 2024",
      readTime: "8 min read",
      category: "Digital Marketing",
      image: "/banner2.jpg",
      featured: false
    },
    {
      id: 3,
      title: "SEO Best Practices: How to Rank Higher on Google",
      excerpt: "Master the art of Search Engine Optimization with these proven strategies and techniques to improve your website's visibility.",
      author: "SEO Experts",
      date: "December 10, 2024",
      readTime: "6 min read",
      category: "SEO",
      image: "/banner3.png",
      featured: false
    },
    {
      id: 4,
      title: "The Future of Remote Work: Skills You Need to Thrive",
      excerpt: "Explore the evolving landscape of remote work and the essential skills needed to succeed in a distributed workforce.",
      author: "Career Advisors",
      date: "December 8, 2024",
      readTime: "7 min read",
      category: "Remote Work",
      image: "/banner4.jpg",
      featured: false
    },
    {
      id: 5,
      title: "Google Ads vs Facebook Ads: Which Platform Should You Choose?",
      excerpt: "A comprehensive comparison of Google Ads and Facebook Ads to help you choose the right platform for your advertising goals.",
      author: "Ad Specialists",
      date: "December 5, 2024",
      readTime: "9 min read",
      category: "Advertising",
      image: "/seo.png",
      featured: false
    },
    {
      id: 6,
      title: "Building Your Personal Brand in the Digital Age",
      excerpt: "Learn how to create a strong personal brand that sets you apart in today's competitive digital landscape.",
      author: "Brand Strategists",
      date: "December 3, 2024",
      readTime: "6 min read",
      category: "Personal Branding",
      image: "/google.png",
      featured: false
    }
  ];

  const categories = ["All", "Career Tips", "Digital Marketing", "SEO", "Remote Work", "Advertising", "Personal Branding"];

  return (
    <>
      <Head>
        <title>Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center</title>
        <meta name="description" content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center." />
        <meta name="keywords" content="digital career blog, digital marketing tips, SEO insights, web development trends, career development, digital skills blog" />
        <meta property="og:title" content="Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center" />
        <meta property="og:description" content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center." />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Career Blog - Latest Tips, Trends & Insights | Digital Career Center" />
        <meta name="twitter:description" content="Stay updated with the latest digital career trends, tips, and insights. Read expert articles on digital marketing, SEO, web development, and career development from Digital Career Center." />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com/blog" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "Digital Career Center Blog",
              "description": "Stay updated with the latest digital career trends, tips, and insights from Digital Career Center.",
              "url": "https://domainisdigitalcareercenter.com/blog",
              "publisher": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "url": "https://domainisdigitalcareercenter.com"
              },
              "blogPost": blogPosts.map(post => ({
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt,
                "author": {
                  "@type": "Organization",
                  "name": post.author
                },
                "datePublished": post.date,
                "image": `https://domainisdigitalcareercenter.com${post.image}`,
                "url": `https://domainisdigitalcareercenter.com/blog/${post.id}`
              }))
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
      <section className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Digital Career Blog
            </h1>
            <p className="text-xl md:text-2xl text-red-100 max-w-3xl mx-auto">
              Stay updated with the latest trends, tips, and insights in digital careers and technology
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Featured Article
          </h2>
          
          {blogPosts.filter(post => post.featured).map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center mb-4">
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="ml-4 text-gray-500 text-sm">{post.readTime}</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">By {post.author}</p>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </div>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors">
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 px-6 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === "All"
                    ? "bg-red-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-600"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Latest Articles
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.filter(post => !post.featured).map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={400}
                  height={250}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="ml-2 text-gray-500 text-xs">{post.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">By {post.author}</p>
                      <p className="text-sm text-gray-500">{post.date}</p>
                    </div>
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">
                      Read More →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-6 bg-red-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Stay Updated with Our Latest Posts
          </h2>
          <p className="text-red-100 text-lg mb-8">
            Get the latest digital career tips and industry insights delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email address"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-300"
            />
            <button className="bg-white text-red-600 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>

     
      </div>
    </>
  );
};

export default BlogPage;
