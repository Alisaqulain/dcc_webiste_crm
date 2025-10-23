"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";

const BlogPage = () => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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
    "Other"
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
        ...(selectedCategory !== 'All' && { category: selectedCategory })
      });

      const response = await fetch(`/api/blogs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.blogs);
        
        // Find featured post
        const featured = data.blogs.find(blog => blog.isFeatured);
        setFeaturedPost(featured);
      } else {
        console.error('Error fetching blogs');
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

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
      {featuredPost && (
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Featured Article
            </h2>
            
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-12">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <Image
                    src={featuredPost.featuredImage}
                    alt={featuredPost.title}
                    width={600}
                    height={400}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center mb-4">
                    <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                      {featuredPost.category}
                    </span>
                    <span className="ml-4 text-gray-500 text-sm">{featuredPost.readingTime} min read</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">By {featuredPost.author.name}</p>
                      <p className="text-sm text-gray-500">{new Date(featuredPost.publishedAt).toLocaleDateString()}</p>
                    </div>
                    <Link 
                      href={`/blog/${featuredPost.slug}`}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Read More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Search and Category Filter */}
      <section className="py-8 px-6 bg-white border-b">
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
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
            {loading ? 'Loading Articles...' : 'Latest Articles'}
          </h2>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No blog posts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.filter(post => !post.isFeatured).map((post) => (
                <article key={post._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Image
                    src={post.featuredImage}
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
                      <span className="ml-2 text-gray-500 text-xs">{post.readingTime} min read</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">By {post.author.name}</p>
                        <p className="text-sm text-gray-500">{new Date(post.publishedAt).toLocaleDateString()}</p>
                      </div>
                      <Link 
                        href={`/blog/${post.slug}`}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
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
