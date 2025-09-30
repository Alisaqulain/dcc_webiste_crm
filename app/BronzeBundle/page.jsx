'use client';

import React, { useState } from 'react';
import Head from 'next/head';
// import Header from '../components/Header';
// import Footer from '../components/Footer';

export default function BronzeBundlePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);

  const handleBuyNow = () => {
    // Handle purchase logic here
    console.log('Buy Now clicked for Bronze Bundle');
  };

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const courses = [
    { title: "LinkedIn Mastery Course (HINDI)", icon: "💼", color: "bg-blue-600" },
    { title: "Video Creation Mastery Course", icon: "🎥", color: "bg-red-600" },
    { title: "Email Marketing Mastery", icon: "📧", color: "bg-green-600" },
    { title: "Content Creation Mastery", icon: "✍️", color: "bg-red-600" },
    { title: "Organic Affiliate Marketing Mastery", icon: "🚀", color: "bg-orange-600" }
  ];

  const faqs = [
    {
      question: "What is Digital Career Center?",
      answer: "Digital Career Center is a comprehensive ed-tech platform that offers skill-based courses designed to enhance your professional capabilities and career prospects."
    },
    {
      question: "What is the Digital Career Center Affiliate program?",
      answer: "The Digital Career Center Affiliate program allows you to earn commissions by promoting our courses and helping others discover valuable learning opportunities."
    },
    {
      question: "How much commission does Digital Career Center offer?",
      answer: "Digital Career Center offers competitive commission rates that vary based on the course package and your performance level in the affiliate program."
    },
    {
      question: "How is Digital Career Center different from other courses and affiliate programs?",
      answer: "Digital Career Center stands out with its practical, industry-focused curriculum, expert instructors, and comprehensive support system for both learners and affiliates."
    },
    {
      question: "Is Digital Career Center a legal system?",
      answer: "Yes, Digital Career Center operates as a legitimate educational platform with proper business registrations and compliance with all applicable laws and regulations."
    },
    {
      question: "What benefits do I get if I buy the product?",
      answer: "Purchasing our courses gives you lifetime access to premium content, expert guidance, practical assignments, and a recognized certificate of completion."
    },
    {
      question: "When will I get my commission?",
      answer: "Commissions are typically processed within 7-14 business days after successful course completion by your referred students."
    },
    {
      question: "How much money can I make from the Affiliate Program at Digital Career Center?",
      answer: "Your earning potential depends on your marketing efforts, network size, and the number of successful referrals you generate through our platform."
    },
    {
      question: "Where can I access the videos of my Digital Career Center training courses?",
      answer: "All course videos are accessible through our secure learning portal, available on both desktop and mobile devices with your login credentials."
    },
    {
      question: "How should I contact them if my sponsor isn't offering any support?",
      answer: "If you need support, you can reach our customer service team directly through our website, email, or dedicated support channels."
    },
    {
      question: "Can I upgrade my plans?",
      answer: "Yes, you can upgrade your course plans at any time to access more advanced content and additional features."
    }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Aditya Verma",
      role: "Student",
      quote: "Digital Career Center has completely transformed my life and helped to become the best version of myself. I believe this is one the best ed-tech platforms which gives you the utmost freedom to learn at your own pace."
    }
  ];

  return (
    <>
      <Head>
        <title>Digital Starter Package (DSP) - Bronze Bundle Course | Digital Career Center</title>
        <meta name="description" content="Master essential office skills with our Digital Starter Package (DSP) Bronze Bundle. Learn Microsoft Office, professional communication, resume building, and interview preparation. 21 hours of content for just ₹1,899." />
        <meta name="keywords" content="digital starter package, DSP course, bronze bundle, Microsoft Office course, professional communication, resume building, interview preparation, office skills training" />
        <meta property="og:title" content="Digital Starter Package (DSP) - Bronze Bundle Course | Digital Career Center" />
        <meta property="og:description" content="Master essential office skills with our Digital Starter Package (DSP) Bronze Bundle. Learn Microsoft Office, professional communication, resume building, and interview preparation. 21 hours of content for just ₹1,899." />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com/BronzeBundle" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Starter Package (DSP) - Bronze Bundle Course | Digital Career Center" />
        <meta name="twitter:description" content="Master essential office skills with our Digital Starter Package (DSP) Bronze Bundle. Learn Microsoft Office, professional communication, resume building, and interview preparation. 21 hours of content for just ₹1,899." />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com/BronzeBundle" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              "name": "Digital Starter Package (DSP) - Bronze Bundle",
              "description": "Master essential office skills with our Digital Starter Package (DSP) Bronze Bundle. Learn Microsoft Office, professional communication, resume building, and interview preparation.",
              "provider": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "url": "https://domainisdigitalcareercenter.com"
              },
              "courseCode": "DSP-BRONZE",
              "educationalLevel": "Beginner to Intermediate",
              "timeRequired": "P21H",
              "coursePrerequisites": "Basic computer knowledge",
              "teaches": [
                "Microsoft Office Proficiency",
                "Professional Communication",
                "Resume & Interview Preparation",
                "LinkedIn Mastery",
                "Video Creation",
                "Email Marketing",
                "Content Creation",
                "Organic Affiliate Marketing"
              ],
              "offers": {
                "@type": "Offer",
                "price": "1899",
                "priceCurrency": "INR",
                "availability": "https://schema.org/InStock",
                "validFrom": "2024-01-01"
              },
              "inLanguage": "en-IN",
              "isAccessibleForFree": false,
              "educationalCredentialAwarded": "Certificate of Completion"
            })
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* <Header /> */}
        
        {/* Top Header Section */}
      <div className="relative overflow-hidden">
       <img src="/dsps.jpg" alt="" className='w-full h-[300px] md:h-[500px] md:w-full ' />

      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Course Overview */}
          <div className="space-y-8">
            {/* Course Overview Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 relative overflow-hidden">
              {/* Background Decorative Element */}
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-100 rounded-full opacity-30"></div>
              
              <h2 className="text-3xl font-bold text-gray-800 mb-6 relative z-10">
                Course Overview
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-8 relative z-10">
                The Bronze Bundle is designed to make you efficient, professional, and job-ready by mastering essential office skills. Whether you're a student, preparing for a job, or already working, these courses will help you work smarter, communicate effectively, and confidently present your ideas.
              </p>

              {/* Bundle Specialization */}
              <div className="space-y-6 relative z-10">
                <h3 className="text-2xl font-bold text-gray-800">
                  Bundle Specialization:
                </h3>
                
                <p className="text-gray-700 mb-6">
                  The Bronze Package offers specialized training in essential areas that are vital for thriving in the professional world. This course bundle includes focused modules on:
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-gray-800">Microsoft Office Proficiency:</span>
                      <span className="text-gray-700"> Learn MS Word, Excel, and PowerPoint for documentation, data analysis, and presentations.</span>
                    </div>
                  </li>
                  
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-gray-800">Professional Communication:</span>
                      <span className="text-gray-700"> Develop skills for writing professional emails, crafting clear messages, and expressing ideas in meetings and reports.</span>
                    </div>
                  </li>
                  
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0"></div>
                    <div>
                      <span className="font-semibold text-gray-800">Resume & Interview Preparation:</span>
                      <span className="text-gray-700"> Understand recruiter expectations, structure resumes, prepare for common interview questions, and confident self-presentation.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Course Visual, Pricing, and Includes */}
          <div className="space-y-6">
            {/* Course Visual and Pricing Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              {/* Course Image/Video Thumbnail */}
              <div className="relative bg-red-100 rounded-xl p-8 mb-6 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-4 right-4 w-16 h-16 bg-red-200 rounded-full opacity-60"></div>
                                 <div className="absolute bottom-4 left-4 w-12 h-12 bg-red-200 rounded-full opacity-60"></div>
                
                {/* Main Illustration */}
                <div className="relative z-10 text-center">
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors cursor-pointer">
                      <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Illustration Elements */}
                  <div className="flex items-center justify-center space-x-8">
                    <div className="text-4xl">👨‍💼</div>
                    <div className="text-6xl">💡</div>
                    <div className="text-4xl">👩‍💼</div>
                  </div>
                  
                  {/* Cloud Shapes */}
                  <div className="absolute top-2 left-8 text-2xl opacity-40">☁️</div>
                  <div className="absolute bottom-2 right-8 text-2xl opacity-40">☁️</div>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-4xl font-bold text-red-600">₹1,899</span>
                  <span className="text-xl text-gray-500 line-through">₹2,500</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">Limited Time Offer</p>
              </div>

              {/* Buy Now Button */}
              <button
                onClick={handleBuyNow}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>Buy Now</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </button>
            </div>

            {/* Includes Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Includes</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <span className="text-gray-700">21 hours on-demand video</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Full lifetime access</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Access on mobile and PC</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Assignments</span>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Certificate of Completion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Cards Section */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                <div className={`${course.color} p-4 flex items-center justify-center`}>
                  <span className="text-2xl">{course.icon}</span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 text-center">
                    {course.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Earn the Certificate of Completion Section */}
      <div className="bg-gray-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-gray-800 mb-6">
                Earn the Certificate of Completion
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                Complete your learning journey and earn a recognized certificate that showcases your new skills and knowledge.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">View Course</h4>
                    <p className="text-gray-600">Explore our engaging and informative course content designed to enhance your skills and knowledge in your chosen field.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Learn</h4>
                    <p className="text-gray-600">Dive into the learning experience. Absorb valuable insights, practical knowledge, and industry best practices presented by experts in the field.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Attend Test</h4>
                    <p className="text-gray-600">Assess your understanding and proficiency by participating in a thoughtfully crafted test. This step ensures you have grasped the key concepts and are ready for the next phase.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Get Certificate</h4>
                    <p className="text-gray-600">Upon successful completion of the course and passing the test, proudly receive your Certificate of Completion. Showcase your newfound expertise and use it to advance your career or professional pursuits.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Image Placeholder */}
            <div className="flex justify-center">
              <div className="w-80 h-80 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Certificate Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions Section */}
      <div className="bg-red-50 py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-800 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFAQ === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What Our Student Says Section */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-12">
            What Our Student Says
          </h2>
          
          {/* Testimonial Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 relative">
            {/* Quote Icon */}
            <div className="absolute -top-4 left-8 text-6xl text-gray-300">"</div>
            
            {/* Testimonial Text */}
            <p className="text-xl text-gray-700 leading-relaxed mb-6 relative z-10">
              {testimonials[currentTestimonial].quote}
            </p>
            
            {/* Author */}
            <div className="mb-6">
              <p className="font-bold text-lg text-gray-800">{testimonials[currentTestimonial].name}</p>
              <p className="text-gray-600">{testimonials[currentTestimonial].role}</p>
            </div>
            
            {/* Pagination Dots */}
            <div className="flex justify-center space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full ${
                    index === currentTestimonial ? 'bg-red-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>     
      
      {/* <Footer /> */}
      </div>
    </>
  );
}
