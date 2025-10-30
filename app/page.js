'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from 'next/image';
import Head from 'next/head';

const defaultSlides = [
  {
    id: 1,
     image: "/banner3.png"
  },
  {
    id: 2,
       image: "/banner5.jpg"
  },
  {
    id: 3,
    image: "/banner4.jpg"
  }
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [currentInstructor, setCurrentInstructor] = useState(0);
  const [currentPackage, setCurrentPackage] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);
  const packageAutoPlayRef = useRef(null);
  const [slides, setSlides] = useState(defaultSlides);

  const defaultPackages = [
    {
      title: "Digital Starter Package (DSP)",
      courses: "4 Courses",
      hours: "21 Hours",
      enrollments: "140K+ Enrollments",
      price: "₹1,899",
      oldPrice: "₹3,499",
      features: [
        "Live Q&A Support",
        "140K+ Students Enrolled",
        "DCC Certificate",
        "Basic Support",
        "Email Support",
        "Community Access"
      ],
      image: "/dsp.png",
      link: "/BronzeBundle"
    },
    {
      title: "Advance Basic Computer (ABC)",
      courses: "14 Courses",
      hours: "52 Hours",
      enrollments: "90K+ Enrollments",
      price: "₹3,499",
      oldPrice: "₹5,999",
      features: [
        "Live Q&A Support",
        "90K+ Students Enrolled",
        "DCC Certificate",
        "Priority Support",
        "Email Support",
        "Community Access"
      ],
      image: "/acb.png",
      link: "/silver"
    },
    {
      title: "Search Engine Optimization (SEO)",
      courses: "25 Courses",
      hours: "85 Hours",
      enrollments: "75K+ Enrollments",
      price: "₹5,999",
      oldPrice: "₹9,999",
      features: [
        "Live Q&A Support",
        "75K+ Students Enrolled",
        "DCC Certificate",
        "Priority Support",
        "1-on-1 Mentoring",
        "Community Access"
      ],
      image: "/seo.png",
      link: "/gold"
    },
    {
      title: "Hindi Typing (HT)",
      courses: "40 Courses",
      hours: "120 Hours",
      enrollments: "50K+ Enrollments",
      price: "₹8,999",
      oldPrice: "₹14,999",
      features: [
        "Live Q&A Support",
        "50K+ Students Enrolled",
        "DCC Certificate",
        "Priority Support",
        "1-on-1 Mentoring",
        "Career Guidance"
      ],
      image: "/hindi.png",
      link: "/platinum"
    },
    {
      title: "Youtube Ads (YA)",
      courses: "60 Courses",
      hours: "180 Hours",
      enrollments: "25K+ Enrollments",
      price: "₹12,999",
      oldPrice: "₹19,999",
      features: [
        "Live Q&A Support",
        "25K+ Students Enrolled",
        "DCC Certificate",
        "Priority Support",
        "1-on-1 Mentoring",
        "Career Guidance"
      ],
      image: "/you.png",
      link: "/Diamond"
    },
    {
      title: "Google Ads (GA)",
      courses: "80 Courses",
      hours: "250 Hours",
      enrollments: "15K+ Enrollments",
      price: "₹18,999",
      oldPrice: "₹29,999",
      features: [
        "Live Q&A Support",
        "15K+ Students Enrolled",
        "DCC Certificate",
        "Priority Support",
        "1-on-1 Mentoring",
        "Career Guidance"
      ],
      image: "/google.png",
      link: "/dcc"
    },
  ];

  const defaultInstructors = [
    { name: "Mr Kaleem Sir", role: "Instructor", img: "/kaleem sir .png" },
    { name: "Mr Aasif Khan", role: "Instructor", img: "/my profile pic.png" },
    { name: "Mr Ibrahim", role: "Instructor", img: "/ibrahim finel pose.png" },
    { name: "Mr Shivam", role: "Instructor", img: "/shivam fine pose.png" },
    { name: "Mr Asad", role: "Instructor", img: "/asad.png" },
    { name: "Mr Arham", role: "Instructor", img: "/arham finel pose.png" },
  ];

  const defaultTestimonials = [
    {
      id: 1,
      text: "This platform has helped me to overcome my fears and make the most out of given opportunities. If you wish to upskill yourself and acquire knowledge from top mentors then this is just the right platform for you.",
      author: "Deepak Saini",
      role: "Student",
      rating: 5
    },
    {
      id: 2,
      text: "Digital Career Center completely transformed my life and helped me become the person I am today. I learned how to start my career and grow with the right guidance.",
      author: "Aanu Shaco",
      role: "Student",
      rating: 5
    },
    {
      id: 3,
      text: "The instructors here are amazing and the course content is very practical. I got placed in a top company just after completing my course. Highly recommended!",
      author: "Priya Sharma",
      role: "Student",
      rating: 5
    }
  ];

  // Load editable homepage content
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/home', { cache: 'no-store' });
        const data = await res.json();
        const c = data?.content;
        if (c) {
          if (Array.isArray(c.heroSlides) && c.heroSlides.length) setSlides(c.heroSlides);
          if (Array.isArray(c.packages) && c.packages.length) setPackages(c.packages);
          if (Array.isArray(c.instructors) && c.instructors.length) setInstructors(c.instructors);
          if (Array.isArray(c.testimonials) && c.testimonials.length) setTestimonials(c.testimonials);
        }
      } catch (e) {
        // ignore and use defaults
      }
    };
    load();
  }, []);

  const [packages, setPackages] = useState(defaultPackages);
  const [instructors, setInstructors] = useState(defaultInstructors);
  const [testimonials, setTestimonials] = useState(defaultTestimonials);

  const prevSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  const nextInstructor = useCallback(() => {
    setCurrentInstructor(prev => {
      // For mobile (1 card), maxIndex is instructors.length - 1
      // For desktop (3 cards), maxIndex is instructors.length - 3
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const maxIndex = isMobile ? Math.max(0, instructors.length - 1) : Math.max(0, instructors.length - 3);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  }, [instructors.length]);

  const prevInstructor = useCallback(() => {
    setCurrentInstructor(prev => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const maxIndex = isMobile ? Math.max(0, instructors.length - 1) : Math.max(0, instructors.length - 3);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }, [instructors.length]);

  const nextPackage = useCallback(() => {
    setCurrentPackage(prev => {
      // For mobile (1 card), maxIndex is packages.length - 1
      // For desktop (2 cards), maxIndex is packages.length - 2
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const maxIndex = isMobile ? Math.max(0, packages.length - 1) : Math.max(0, packages.length - 2);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  }, [packages.length]);

  const prevPackage = useCallback(() => {
    setCurrentPackage(prev => {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
      const maxIndex = isMobile ? Math.max(0, packages.length - 1) : Math.max(0, packages.length - 2);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }, [packages.length]);

  const nextTestimonial = useCallback(() => {
    setCurrentTestimonial(prev => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const prevTestimonial = useCallback(() => {
    setCurrentTestimonial(prev => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextPackage();
    } else if (isRightSwipe) {
      prevPackage();
    }
  };

  // Auto-play for instructor slider
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      nextInstructor();
    }, 4000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [nextInstructor]);

  // Auto-play for packages slider
  useEffect(() => {
    packageAutoPlayRef.current = setInterval(() => {
      nextPackage();
    }, 5000);

    return () => {
      if (packageAutoPlayRef.current) {
        clearInterval(packageAutoPlayRef.current);
      }
    };
  }, [nextPackage]);

  // Auto-play for testimonials slider
  useEffect(() => {
    const testimonialAutoPlay = setInterval(() => {
      nextTestimonial();
    }, 6000);

    return () => {
      clearInterval(testimonialAutoPlay);
    };
  }, [nextTestimonial]);

  // Auto-play for main slider
  useEffect(() => {
    const autoSlide = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 4000);

    return () => {
      clearInterval(autoSlide);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Digital Career Center - Transform Your Career with Expert-Led Digital Skills Courses</title>
        <meta name="description" content="Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified. Digital marketing, SEO, web development courses in Muzaffarnagar." />
        <meta name="keywords" content="digital marketing course, SEO training, web development course, digital career center, computer course Muzaffarnagar, digital skills training, online courses India, career development, professional certification, digital marketing institute" />
        <meta property="og:title" content="Digital Career Center - Transform Your Career with Expert-Led Digital Skills Courses" />
        <meta property="og:description" content="Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified. Digital marketing, SEO, web development courses in Muzaffarnagar." />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Digital Career Center - Transform Your Career with Expert-Led Digital Skills Courses" />
        <meta name="twitter:description" content="Master essential digital skills and advance your professional journey with our comprehensive course bundles. Learn from industry professionals and get certified. Digital marketing, SEO, web development courses in Muzaffarnagar." />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Digital Career Center",
              "url": "https://domainisdigitalcareercenter.com",
              "description": "Digital Career Center - Transform Your Career with Expert-Led Digital Skills Courses",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://domainisdigitalcareercenter.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "url": "https://domainisdigitalcareercenter.com"
              }
            })
          }}
        />
      </Head>
      <div className="w-full">
        {/* Slider Section */}
      <div className="relative w-full h-[200px] sm:h-[400px] md:h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${index === current ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <div className="w-full h-[85%] md:w-full md:h-full flex items-center justify-center relative">
              <Image
                src={slide.image}
                alt={`Slide ${slide.id}`}
                fill
                // className="object-cover"
                priority={index === 0}
              />
            </div>
          </div>
        ))}

        {/* Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-75 transition-all"
        >
          <FaChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 sm:p-3 rounded-full hover:bg-opacity-75 transition-all"
        >
          <FaChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${index === current ? 'bg-red-500' : 'bg-white bg-opacity-50'
                }`}
            />
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-4">
              Why Choose Digital Career Center
              <div className="w-24 sm:w-148 h-1 sm:h-2 bg-red-600 mx-auto mt-2"></div>
            </h2>
            <p className="text-base sm:text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed px-2">
  Digital Career Center is the ideal platform to launch your digital career. 
  We provide expert-led, practical training with live projects that ensure you gain 
  real-world skills. Along with personalized mentorship, placement assistance, and 
  flexible batch schedules, we make learning accessible for everyone. With affordable 
  fees and a comprehensive curriculum, Digital Career Center equips you with the 
  knowledge and confidence required for high-demand roles in digital marketing and 
  related fields.
</p>

          </div>

          {/* 3 Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mt-8 sm:mt-12">
  {/* Card 1 */}
  <div className="text-center p-4 sm:p-6 rounded-lg">
    <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/brief.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
      Expert Instructors
    </h3>
    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
      Learn from seasoned professionals with real-world industry 
      experience who provide hands-on training and personalized 
      mentorship to help you succeed in your digital career.
    </p>
  </div>

  {/* Card 2 */}
  <div className="text-center p-4 sm:p-6 rounded-lg">
  <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/learn.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
      Flexible Learning
    </h3>
    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
      We offer flexible learning options including online, offline, 
      and self-paced classes, allowing you to balance studies with 
      personal and professional commitments comfortably.
    </p>
  </div>

  {/* Card 3 */}
  <div className="text-center p-4 sm:p-6 rounded-lg">
  <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/cerit.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
      Certification
    </h3>
    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
      Earn industry-recognized certification upon completion, 
      validating your skills and boosting your credibility. 
      Designed by experts, these certifications are highly valued 
      by employers and help advance your career.
    </p>
  </div>
</div>

          {/* Packages Section */}
          <section className="py-8 sm:py-12 md:pt-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-6 text-black px-4">
  Our Exclusive Packages
  <span className="block w-20 sm:w-88 h-1 bg-red-600 mx-auto mt-2"></span>

</h2>
<p className="text-center text-sm sm:text-base text-gray-700 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4">
  Digital Career Center offers customized training packages designed to match 
  different skill levels and career goals. Whether you are just starting out 
  or looking to advance, choose from beginner to advanced programs such as 
  Digital Marketing, Digital Starter Pack, Web Designing, Video Editing, SEO, 
  and more. Each package provides hands-on experience through live projects, 
  along with personalized mentorship, industry-recognized certification, and 
  dedicated placement support—empowering you to effectively launch or grow your 
  digital career.
</p>


            {/* Packages Slider */}
            <div 
              className="relative max-w-6xl mx-auto overflow-hidden px-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex transition-transform duration-500 ease-in-out"
                style={{ 
                  transform: `translateX(-${currentPackage * (typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : 50)}%)` 
                }}
              >
                {packages.map((pkg, index) => (
                  <div
                    key={index}
                    className="min-w-full sm:min-w-[50%] flex-shrink-0 px-1 sm:px-0 md:px-1"
                  >
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border h-full max-w-sm mx-auto flex flex-col transform " style={{boxShadow: '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)'}}>
                      {/* Image */}
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center h-32 sm:h-36 md:h-40 flex-shrink-0 relative overflow-hidden" style={{boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'}}>
                        <img
                          src={pkg.image}
                          alt={pkg.title}
                          width={200}
                          height={160}
                          className="w-56 h-30 sm:w-32 sm:h-28 md:w-50 md:h-42 object-contain transform hover:scale-110 transition-transform duration-300" 
                          style={{filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'}}
                        />
                      </div>

                      {/* Content */}
                      <div className="p-3 md:p-4 flex flex-col flex-grow bg-gradient-to-b from-gray-50 to-gray-200 relative" style={{boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.1)'}}>
                        {/* Title */}
                        <h3 className="text-sm sm:text-base md:text-lg font-bold mb-3 text-center text-gray-900">
                          <a href={pkg.link} className="hover:text-red-600 transition-colors">
                            {pkg.title}
                          </a>
                        </h3>

                        {/* Main content area */}
                        <div className="flex flex-row flex-grow">
                          {/* Left side - Features */}
                          <div className="flex-1 pr-2">
                            <ul className="space-y-1 text-gray-600 text-xs">
                              {pkg.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <span className="text-green-500 text-xs">✅</span>
                                  <span className="text-xs">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Right side - Metrics */}
                          <div className="flex flex-col gap-1 text-gray-700 text-xs justify-start">
                            <div className="flex flex-col items-center bg-gradient-to-b from-blue-100 to-blue-200 px-2 py-1 rounded-lg min-w-[60px] transform hover:scale-105 transition-transform duration-200" style={{boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                              <span className="text-blue-600 text-xs">📘</span>
                              <span className="font-medium text-center text-xs">{pkg.courses}</span>
                            </div>
                            <div className="flex flex-col items-center bg-gradient-to-b from-orange-100 to-orange-200 px-2 py-1 rounded-lg min-w-[60px] transform hover:scale-105 transition-transform duration-200" style={{boxShadow: '0 2px 4px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                              <span className="text-orange-600 text-xs">⏳</span>
                              <span className="font-medium text-center text-xs">{pkg.hours}</span>
                            </div>
                            <div className="flex flex-col items-center bg-gradient-to-b from-green-100 to-green-200 px-2 py-1 rounded-lg min-w-[60px] transform hover:scale-105 transition-transform duration-200" style={{boxShadow: '0 2px 4px rgba(34, 197, 94, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'}}>
                              <span className="text-green-600 text-xs">👥</span>
                              <span className="font-medium text-center text-xs">{pkg.enrollments}</span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom section - Pricing and Button */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                              {pkg.price}
                            </span>
                            <span className="line-through text-gray-500 text-xs sm:text-sm">
                              {pkg.oldPrice}
                            </span>
                          </div>
                          <a 
                            href={pkg.link}
                            className="bg-gradient-to-b from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-bold px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-all duration-300 w-full sm:w-auto transform hover:scale-105 hover:-translate-y-1 inline-block text-center" 
                            style={{boxShadow: '0 4px 8px rgba(220, 38, 38, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)'}}
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation buttons - Visible on all screen sizes */}
              <button
                onClick={prevPackage}
                className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 bg-white rounded-full p-2 sm:p-3 shadow-md hover:bg-gray-100 transition-colors"
              >
                <FaChevronLeft className="text-gray-700 w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={nextPackage}
                className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 bg-white rounded-full p-2 sm:p-3 shadow-md hover:bg-gray-100 transition-colors"
              >
                <FaChevronRight className="text-gray-700 w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center mt-4 md:mt-6 space-x-2">
              {Array.from({ length: Math.max(1, typeof window !== 'undefined' && window.innerWidth < 640 ? packages.length : packages.length - 1) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPackage(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${index === currentPackage ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* How Digital Career Center Works Section */}
      <section className="py-8 sm:pb-12 md:pb-16 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 relative inline-block text-black">
          How Digital Career Center Works
          <span className="block w-20 sm:w-118 h-1 bg-red-600 mx-auto mt-2"></span>
        </h2>
        
        {/* Main Description */}
        <div className="max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16">
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6 sm:mb-8 px-2">
            Digital Career Center is designed to empower learners with practical digital skills through a structured and supportive approach. First, students choose from tailored courses based on their career goals and skill levels. Expert instructors provide hands-on training, combining theoretical knowledge with real-world projects. Throughout the learning journey, students receive mentorship and personalized guidance to master essential digital tools and techniques. After course completion, career support services, including placement assistance, internships, and networking opportunities, help students transition smoothly into the digital job market.
          </p>
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed px-2">
            The process emphasizes industry-relevant skills, flexible learning options, and ongoing support to ensure success in a competitive digital economy. This holistic model integrates training, mentorship, and employment readiness, making it an effective pathway for digital career growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 max-w-6xl mx-auto">
          {/* Card 1 */}
          <div className="flex flex-col items-center h-full">
          <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/teacher.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Educate</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed flex-grow">
              Digital Career Center offers expert-led training to equip you with practical digital skills, flexible learning, and certification, preparing you for a successful career in the growing digital economy.
            </p>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center h-full">
          <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/cloud-computing.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Innovate</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed flex-grow">
              At Digital Career Center, we embrace cutting-edge technology and creative learning methods like AI personalization, gamification, and immersive experiences to make education engaging, adaptive, and future-ready.
            </p>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center h-full">
          <div className="w-30 h-30 sm:w-50 sm:h-50  mx-auto mb-4 sm:mb-5 flex items-center justify-center">
   <img src='/rocket-ship.gif' alt='Expert Instructors' className='w-30 h-30 sm:w-45 sm:h-40 text-white' />
    </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Dominate</h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed flex-grow">
              Take control of your digital future with the skills and confidence gained at Digital Career Center, empowering you to excel and lead in the competitive digital landscape.
            </p>
          </div>
        </div>
      </section>

      {/* Why Digital Career Center Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 mx-auto  text-black">
          Why Digital Career Center
          <span className="block w-20 sm:w-92 h-1 bg-red-600 mx-auto mt-2"></span>
        </h2>
        <div className="max-w-4xl mb-8 sm:mb-12 md:mb-16 mx-auto text-center">
          <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed mb-6 sm:mb-8 px-2">
          Digital Career Center stands out by offering a blend of expert mentorship, hands-on projects, flexible learning, and guaranteed placement support, ensuring learners not only gain in-demand digital skills but also confidently transition into successful careers. Its unique focus on personalized guidance and community engagement creates a supportive environment for growth and job readiness.          </p>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center">
          {/* Left side - Points */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-start bg-white shadow-md rounded-lg p-3 sm:p-4">
              <img
                src="economic-growth.png"
                alt="Trends"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-12 sm:h-12 mr-3 sm:mr-4 flex-shrink-0"
              />
              <p className="text-sm sm:text-base text-gray-700">
                Keep oneself up to date with the most recent market trends because of the fierce rivalry.
              </p>
            </div>

            <div className="flex items-start bg-white shadow-md rounded-lg p-3 sm:p-4">
              <img
                src="cv.png"
                alt="Certification"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 mr-3 sm:mr-4 flex-shrink-0"
              />
              <p className="text-sm sm:text-base text-gray-700">
                With Digital Career Center certification now you can boost your CV to kick start your professional career.
              </p>
            </div>

            <div className="flex items-start bg-white shadow-md rounded-lg p-3 sm:p-4">
              <img
                src="payment.png"
                alt="Commission"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 mr-3 sm:mr-4 flex-shrink-0"
              />
              <p className="text-sm sm:text-base text-gray-700">
                Join us and earn a decent amount of commission for your professional journey.
              </p>
            </div>

            <div className="flex items-start bg-white shadow-md rounded-lg p-3 sm:p-4">
              <img
                src="trainer.png"
                alt="Partner Program"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-13 sm:h-15 mr-3 sm:mr-4 flex-shrink-0"
              />
              <p className="text-sm sm:text-base text-gray-700">
                With Digital Career Center exclusive partner program, new trainers can start their journey and build their strong position in the market.
              </p>
            </div>
          </div>

          {/* Right side - Illustration */}
          <div className="flex justify-center">
            <img
              src="/gif.gif"
              alt="Animated illustration"
              className="w-74 h-72 sm:w-80 sm:h-90 md:w-150 md:h-100 rounded-xl "
            />
          </div>
        </div>
      </section>

      {/* Instructors Section with Looping Card Slider */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 relative inline-block text-black">
          Our Instructors
          <span className="block w-20 sm:w-60 h-1 bg-red-600 mx-auto mt-2"></span>
          
        </h2>
        <p className="text-sm sm:text-base text-gray-700 mb-8 sm:mb-12 md:mb-16 w-full sm:w-2/3 mx-auto px-2">
        Our instructors are industry experts dedicated to providing personalized mentorship and practical training, ensuring every student gains the skills and confidence needed to excel in the digital world.              </p>

        <div className="relative max-w-6xl mx-auto overflow-hidden px-4">
          <div className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentInstructor * (typeof window !== 'undefined' && window.innerWidth < 640 ? 100 : 33.333)}%)` }}
          >
            {instructors.map((ins, idx) => (
              <div
                key={idx}
                className="min-w-full sm:min-w-[33.333%] flex-shrink-0 px-2 sm:px-4"
              >
               <div
  className="bg-gradient-to-b from-gray-400 to-gray-900 rounded-xl shadow-2xl p-4 sm:p-6 flex flex-col items-center transition-all"
  style={{
    boxShadow:
      "0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.3)",
  }}
>
  <div className="relative mb-3 sm:mb-4">
    <Image
      src={ins.img}
      alt={ins.name}
      width={200}
      height={200}
      className="rounded-full w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-cover transform hover:scale-110 transition-transform duration-300"
      style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" }}
    />
  </div>
  <h3 className="font-bold text-lg sm:text-xl text-center mb-2 text-white">
    {ins.name}
  </h3>
  <p className="text-sm sm:text-base text-gray-300 text-center">{ins.role}</p>
</div>

              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prevInstructor}
            className="absolute left-2 sm:left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 bg-white rounded-full p-2 sm:p-3 shadow-md hover:bg-gray-100 transition-colors"
          >
            <FaChevronLeft className="text-gray-700 w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={nextInstructor}
            className="absolute right-2 sm:right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 bg-white rounded-full p-2 sm:p-3 shadow-md hover:bg-gray-100 transition-colors"
          >
            <FaChevronRight className="text-gray-700 w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {Array.from({ length: Math.max(1, typeof window !== 'undefined' && window.innerWidth < 640 ? instructors.length : instructors.length - 2) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentInstructor(index)}
              className={`w-3 h-3 rounded-full ${index === currentInstructor ? 'bg-red-600' : 'bg-gray-300'
                }`}
            />
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-black">
          Hear from Our Success Stories
          <span className="block w-20 sm:w-110 h-1 bg-red-600 mx-auto mt-2"></span>
        </h2>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
            {/* Left side - Testimonial box */}
            <div className="flex-1 lg:w-2/3">
              <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 relative" style={{ backgroundColor: '#f8f4ff' }}>
                {/* Navigation arrows */}
                <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2">
                  <button
                    onClick={prevTestimonial}
                    className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaChevronLeft className="text-red-600 text-xs sm:text-sm" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <FaChevronRight className="text-red-600 text-xs sm:text-sm" />
                  </button>
                </div>

                {/* Star rating */}
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                {/* Testimonial text */}
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {testimonials[currentTestimonial].text.split('.')[0] + '.'}
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4 sm:mb-6">
                  {testimonials[currentTestimonial].text.split('.').slice(1).join('.').trim()}
                </p>

                {/* Quote marks */}
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>

                {/* Author info */}
                <div className="text-left pl-10 sm:pl-15">
                  <h4 className="font-bold text-base sm:text-lg text-gray-900">{testimonials[currentTestimonial].author}</h4>
                  <p className="text-sm sm:text-base text-gray-600">{testimonials[currentTestimonial].role}</p>
                </div>
              </div>

              {/* Dots indicator */}
              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentTestimonial ? 'bg-red-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right side - Testimonial image */}
            <div className="flex-shrink-0 lg:w-1/3">
              <div className="relative">
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-94 md:h-94 mx-auto relative">
                  {/* Background circle */}
                  <div className="absolute inset-0 bg-purple-200 rounded-full opacity-30"></div>
                  {/* Person image */}
                  <div className="absolute inset-4 rounded-full overflow-hidden">
                    <Image
                      src={(testimonials[currentTestimonial] && testimonials[currentTestimonial].image) ? testimonials[currentTestimonial].image : '/girl.jpg'}
                      alt={testimonials[currentTestimonial]?.author || 'Happy Student'}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                  {/* Pointing gesture */}
                  <div className="absolute left-6 sm:left-8 top-1/2 transform -translate-y-1/2">
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Media Presence Section */}
      <section className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 relative inline-block text-black">
          Our Media Presence
          <span className="block w-20 sm:w-74 h-1 bg-red-600 mx-auto mt-2"></span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {[
            "mid-day",
            "Outlook",
            "Business Standard",
            "The India Saga",
            "ANI",
            "ThePrint",
            "Instamojo",
            "LatestLY",
          ].map((logo, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md p-4 sm:p-6 text-center font-semibold text-sm sm:text-base"
            >
              {logo}
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer Section */}
      <footer className="bg-red-600 text-center py-4 sm:py-6 mt-8 sm:mt-12">
        <p className="text-xs sm:text-sm text-white max-w-3xl mx-auto px-4 mb-4">
          Disclaimer: Digital Career Center is an independent training provider. All content
          and materials are for educational purposes only and do not guarantee
          job placement or career advancement.
        </p>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          <a 
            href="/disclaimer" 
            className="text-xs sm:text-sm text-white hover:text-gray-200 underline transition-colors duration-200"
          >
            Disclaimer
          </a>
         
          <a 
            href="/privacy-policy" 
            className="text-xs sm:text-sm text-white hover:text-gray-200 underline transition-colors duration-200"
          >
            Privacy Policy
          </a>
          <a 
            href="/terms-and-conditions" 
            className="text-xs sm:text-sm text-white hover:text-gray-200 underline transition-colors duration-200"
          >
            Terms & Conditions
          </a>
          <a 
            href="/refund-policy" 
            className="text-xs sm:text-sm text-white hover:text-gray-200 underline transition-colors duration-200"
          >
            Refund Policy
          </a>
        </div>
      </footer>
      </div>
    </>
  );
}