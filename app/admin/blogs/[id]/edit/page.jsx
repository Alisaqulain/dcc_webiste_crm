'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id;
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    author: {
      name: '',
      email: '',
      avatar: ''
    },
    category: '',
    tags: '',
    status: 'draft',
    isFeatured: false,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    'Technology',
    'Digital Marketing',
    'Web Development',
    'Data Science',
    'AI/ML',
    'Business',
    'Education',
    'Career',
    'Other'
  ];

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    
    fetchBlog();
  }, [blogId, router]);

  // Debug form data changes
  useEffect(() => {
    console.log('Form data updated:', {
      status: formData.status,
      isFeatured: formData.isFeatured,
      title: formData.title
    });
  }, [formData.status, formData.isFeatured, formData.title]);

  const fetchBlog = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const blog = data.blog;
        
        console.log('Blog data received:', {
          id: blog._id,
          title: blog.title,
          status: blog.status,
          isFeatured: blog.isFeatured,
          publishedAt: blog.publishedAt
        });
        
        const formDataToSet = {
          title: blog.title || '',
          excerpt: blog.excerpt || '',
          content: blog.content || '',
          featuredImage: blog.featuredImage || '',
          author: {
            name: blog.author?.name || '',
            email: blog.author?.email || '',
            avatar: blog.author?.avatar || ''
          },
          category: blog.category || '',
          tags: blog.tags ? blog.tags.join(', ') : '',
          status: blog.status || 'draft',
          isFeatured: blog.isFeatured || false,
          seo: {
            metaTitle: blog.seo?.metaTitle || '',
            metaDescription: blog.seo?.metaDescription || '',
            keywords: blog.seo?.keywords ? blog.seo.keywords.join(', ') : ''
          }
        };
        
        console.log('Form data being set:', {
          status: formDataToSet.status,
          isFeatured: formDataToSet.isFeatured,
          title: formDataToSet.title
        });
        
        setFormData(formDataToSet);
        setUploadedImage(blog.featuredImage);
      } else {
        const error = await response.json();
        console.error('Error fetching blog:', error);
        alert('Error fetching blog: ' + error.message);
        router.push('/admin/blogs');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      alert('Error fetching blog');
      router.push('/admin/blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadedImage(result.url);
        setFormData(prev => ({ ...prev, featuredImage: result.url }));
      } else {
        alert('Upload failed: ' + result.message);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Clean up data
      const cleanedData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        seo: {
          ...formData.seo,
          keywords: formData.seo.keywords.split(',').map(keyword => keyword.trim()).filter(keyword => keyword)
        }
      };

      const response = await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanedData)
      });
      
      if (response.ok) {
        alert('Blog post updated successfully!');
        router.push('/admin/blogs');
      } else {
        const error = await response.json();
        alert(error.message || 'Error updating blog post');
      }
    } catch (error) {
      console.error('Error updating blog post:', error);
      alert('Error updating blog post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
            <Link
              href="/admin/blogs"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Blogs
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter blog post title..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt *</label>
              <textarea
                required
                rows={3}
                value={formData.excerpt}
                onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                placeholder="Brief description of the blog post..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
              <textarea
                required
                rows={8}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your blog post content here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Featured Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Featured Image *</label>
              
              {/* Image Preview */}
              {(uploadedImage || formData.featuredImage) && (
                <div className="mb-4">
                  <img
                    src={uploadedImage || formData.featuredImage}
                    alt="Featured image preview"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                  />
                </div>
              )}

              {/* Upload Section */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                {isUploading && (
                  <p className="text-sm text-blue-600 mt-1">Uploading...</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP</p>
              </div>
            </div>

            {/* Author Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author Name *</label>
                <input
                  required
                  type="text"
                  value={formData.author.name}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    author: { ...prev.author, name: e.target.value }
                  }))}
                  placeholder="Author name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author Email *</label>
                <input
                  required
                  type="email"
                  value={formData.author.email}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    author: { ...prev.author, email: e.target.value }
                  }))}
                  placeholder="author@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                  <strong>Current Status:</strong> {formData.status}
                </div>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas (e.g., react, javascript, web development)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Featured Post */}
            <div>
              <div className="mb-2 p-2 bg-gray-100 rounded text-sm">
                <strong>Currently Featured:</strong> {formData.isFeatured ? 'Yes' : 'No'}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
                  Mark as featured post
                </label>
              </div>
            </div>

            {/* SEO Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
                  <input
                    type="text"
                    value={formData.seo.metaTitle}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, metaTitle: e.target.value }
                    }))}
                    placeholder="SEO meta title (max 60 characters)"
                    maxLength={60}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                  <textarea
                    rows={3}
                    value={formData.seo.metaDescription}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, metaDescription: e.target.value }
                    }))}
                    placeholder="SEO meta description (max 160 characters)"
                    maxLength={160}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
                  <input
                    type="text"
                    value={formData.seo.keywords}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      seo: { ...prev.seo, keywords: e.target.value }
                    }))}
                    placeholder="Enter keywords separated by commas"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link
                href="/admin/blogs"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Updating...' : 'Update Blog Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
