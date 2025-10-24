'use client';

import { useState } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Head from 'next/head';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        setSubmitStatus('error');
        console.error('Form submission error:', result.error);
      }
    } catch (error) {
      console.error('Network error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us - Digital Career Center | Get in Touch for Digital Skills Training</title>
        <meta name="description" content="Contact Digital Career Center for digital skills training inquiries. Located in Muzaffarnagar, Uttar Pradesh. Call +91-7599863007 or email info@digitalcareercenter.com" />
        <meta name="keywords" content="contact digital career center, digital skills training contact, computer course Muzaffarnagar, digital marketing institute contact" />
        <meta property="og:title" content="Contact Us - Digital Career Center | Get in Touch for Digital Skills Training" />
        <meta property="og:description" content="Contact Digital Career Center for digital skills training inquiries. Located in Muzaffarnagar, Uttar Pradesh. Call +91-7599863007 or email info@digitalcareercenter.com" />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Us - Digital Career Center | Get in Touch for Digital Skills Training" />
        <meta name="twitter:description" content="Contact Digital Career Center for digital skills training inquiries. Located in Muzaffarnagar, Uttar Pradesh. Call +91-7599863007 or email info@digitalcareercenter.com" />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com/contact" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ContactPage",
              "name": "Contact Digital Career Center",
              "description": "Contact Digital Career Center for digital skills training inquiries and course information.",
              "url": "https://domainisdigitalcareercenter.com/contact",
              "mainEntity": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1st Floor, Raja Ji Market, Near M.B Public School, Mimlana Road",
                  "addressLocality": "Muzaffarnagar",
                  "addressRegion": "Uttar Pradesh",
                  "postalCode": "251002",
                  "addressCountry": "IN"
                },
                "contactPoint": [
                  {
                    "@type": "ContactPoint",
                    "telephone": "+91-7599863007",
                    "contactType": "customer service",
                    "areaServed": "IN",
                    "availableLanguage": ["English", "Hindi"]
                  },
                  {
                    "@type": "ContactPoint",
                    "telephone": "+91-8218971413",
                    "contactType": "customer service",
                    "areaServed": "IN",
                    "availableLanguage": ["English", "Hindi"]
                  }
                ],
                "email": "info@digitalcareercenter.com"
              }
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50">
      
        {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contact Us
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-4xl mx-auto">
              Get in touch with us today to learn more and start your journey with Digital Career Center.
            </p>
            <div className="w-32 h-2 bg-white mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Contact Information & Form Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Start your digital journey with Digital Career Center and unlock your full potential with expert training, flexible learning options, and dedicated career support tailored for real-world success.
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaMapMarkerAlt className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Our Location</h3>
                    <p className="text-gray-600">
                      1st Floor, Raja Ji Market, Near M.B Public School<br />
                      Mimlana Road, Muzaffarnagar 251002<br />
                      Uttar Pradesh, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaPhone className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone Numbers</h3>
                    <p className="text-gray-600">
                      <a href="tel:+917599863007" className="hover:text-red-600 transition-colors">
                        +91- 75998 63007
                      </a><br />
                      <a href="tel:+918218971413" className="hover:text-red-600 transition-colors">
                        +91- 82189 71413
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaEnvelope className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Email Address</h3>
                    <p className="text-gray-600">
                      <a href="mailto:info@digitalcareercenter.com" className="hover:text-red-600 transition-colors">
                        info@digitalcareercenter.com
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaClock className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Business Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 7:00 PM<br />
                      Saturday: 9:00 AM - 5:00 PM<br />
                      Sunday: 10:00 AM - 4:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="https://www.facebook.com/people/Digital-Career-Center/61565596980338/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <FaFacebookF />
                  </a>
                  <a href="https://www.instagram.com/digitalcareercenterofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <FaInstagram />
                  </a>
                  <a href="https://www.youtube.com/@DigitalCareercenter" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <FaYoutube />
                  </a>
                  <a href="https://www.linkedin.com/company/digital-career-center" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <FaLinkedinIn />
                  </a>
                  <a href="https://t.me/digitalcareercentermzn" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                    <FaTelegramPlane />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Send us a Message</h2>
              
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  Thank you for your message! We'll get back to you within 24 hours.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  Sorry, there was an error sending your message. Please try again or contact us directly.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Select a subject</option>
                      <option value="course-inquiry">Course Inquiry</option>
                      <option value="admission">Admission Process</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="career-guidance">Career Guidance</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Find Us</h2>
            <p className="text-gray-600">Visit our training center in Muzaffarnagar</p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>
          
          {/* Interactive Map */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="h-96 w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3484.1234567890123!2d77.7044!3d29.4709!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c1b8b8b8b8b8b%3A0x1234567890abcdef!2sMuzaffarnagar%2C%20Uttar%20Pradesh%2C%20India!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Digital Career Center Location - Muzaffarnagar"
                className="rounded-2xl"
              ></iframe>
            </div>
            
            {/* Map Info Overlay */}
            <div className="p-6 bg-gray-50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <FaMapMarkerAlt className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Digital Career Center</h3>
                    <p className="text-gray-600">1st Floor, Raja Ji Market, Near M.B Public School, Mimlana Road, Muzaffarnagar 251002, Uttar Pradesh, India</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <a
                    href="https://maps.google.com/?q=Muzaffarnagar,Uttar+Pradesh,India"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    Open in Maps
                  </a>
                  <a
                    href="https://maps.google.com/?q=Muzaffarnagar,Uttar+Pradesh,India&dirflg=d"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <FaMapMarkerAlt className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Additional Location Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <FaClock className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Operating Hours</h4>
              <p className="text-sm text-gray-600">
                Mon-Fri: 9:00 AM - 7:00 PM<br />
                Sat: 9:00 AM - 5:00 PM<br />
                Sun: 10:00 AM - 4:00 PM
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <FaPhone className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Contact Info</h4>
              <p className="text-sm text-gray-600">
                <a href="tel:+917599863007" className="hover:text-red-600 transition-colors">
                  +91- 75998 63007
                </a><br />
                <a href="tel:+918218971413" className="hover:text-red-600 transition-colors">
                  +91- 82189 71413
                </a><br />
                <a href="mailto:info@digitalcareercenter.com" className="hover:text-red-600 transition-colors">
                  info@digitalcareercenter.com
                </a>
              </p>
            </div>
            
            <div className="text-center p-6 bg-gray-50 rounded-xl">
              <FaMapMarkerAlt className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Easy Access</h4>
              <p className="text-sm text-gray-600">
                Near City Center<br />
                Public Transport Available<br />
                Parking Space Available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Quick answers to common questions</p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">How can I enroll in a course?</h3>
              <p className="text-gray-600">
                You can enroll through our website, visit our center, or contact us directly. 
                We'll guide you through the entire process.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">What are your course timings?</h3>
              <p className="text-gray-600">
                We offer flexible timings including morning, evening, and weekend batches 
                to accommodate different schedules.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Do you provide placement assistance?</h3>
              <p className="text-gray-600">
                Yes, we provide comprehensive placement support including resume building, 
                interview preparation, and job placement assistance.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Can I get a demo class?</h3>
              <p className="text-gray-600">
                Absolutely! We offer free demo sessions so you can experience our 
                teaching quality before enrolling.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <a
              href="/faq"
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              View All FAQs
            </a>
          </div>
        </div>
      </section>

      
      </div>
    </>
  );
}
