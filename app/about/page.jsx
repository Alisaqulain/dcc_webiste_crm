'use client';

import { FaGraduationCap, FaUsers, FaAward, FaGlobe, FaLightbulb, FaRocket, FaHeart, FaShieldAlt, FaTrophy, FaHandshake } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Head from 'next/head';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us - Digital Career Center | Leading Digital Skills Training Institute</title>
        <meta name="description" content="Learn about Digital Career Center, a leading digital skills training institute in Muzaffarnagar since 2018. Discover our mission, vision, values, and success stories." />
        <meta name="keywords" content="about digital career center, digital skills institute Muzaffarnagar, computer training center, digital marketing institute, career development" />
        <meta property="og:title" content="About Us - Digital Career Center | Leading Digital Skills Training Institute" />
        <meta property="og:description" content="Learn about Digital Career Center, a leading digital skills training institute in Muzaffarnagar since 2018. Discover our mission, vision, values, and success stories." />
        <meta property="og:url" content="https://domainisdigitalcareercenter.com/about" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Us - Digital Career Center | Leading Digital Skills Training Institute" />
        <meta name="twitter:description" content="Learn about Digital Career Center, a leading digital skills training institute in Muzaffarnagar since 2018. Discover our mission, vision, values, and success stories." />
        <meta name="twitter:image" content="https://domainisdigitalcareercenter.com/logo.png" />
        <link rel="canonical" href="https://domainisdigitalcareercenter.com/about" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AboutPage",
              "name": "About Digital Career Center",
              "description": "Learn about Digital Career Center, a leading digital skills training institute in Muzaffarnagar since 2018.",
              "url": "https://domainisdigitalcareercenter.com/about",
              "mainEntity": {
                "@type": "EducationalOrganization",
                "name": "Digital Career Center",
                "foundingDate": "2018",
                "description": "Digital Career Center is a leading institute in Muzaffarnagar, dedicated to empowering students and professionals with practical digital skills.",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "1st Floor, Raja Ji Market, Near M.B Public School, Mimlana Road",
                  "addressLocality": "Muzaffarnagar",
                  "addressRegion": "Uttar Pradesh",
                  "postalCode": "251002",
                  "addressCountry": "IN"
                }
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
              About Digital Career Center
            </h1>
            <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-4xl mx-auto">
              Digital Career Center is a leading institute in Muzaffarnagar, dedicated to empowering students and professionals with practical digital skills. Since 2018, we have helped transform careers with hands-on training in digital marketing, computer courses, and web development, focusing on real-world earning opportunities.
            </p>
            <div className="w-32 h-2 bg-white mx-auto"></div>
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mission */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <FaRocket className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Our Mission</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                Empowering students to build successful careers by providing practical digital skills training and work opportunities. Learning with earning is our guiding principle.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <FaLightbulb className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Our Vision</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg">
                To be the most trusted digital learning platform, enabling every learner in India to achieve professional growth, career stability, and real earning through technology-driven education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Story</h2>
            <div className="w-24 h-1 bg-red-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Our Story</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                Digital Career Center was founded in 2018 in Muzaffarnagar with a vision to empower youth with practical digital skills and career opportunities. Starting as a small training initiative, it has grown into a trusted center offering comprehensive courses in digital marketing, computer training, web development, and more.
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                Our journey is driven by the commitment to not just educate but enable earning, helping students transform their lives through technology-driven learning. We believe in Learning with Earning, making real career growth accessible for all.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Today, we're proud to be one of the most trusted names in digital education, with 
                a track record of helping students secure jobs, start businesses, and advance their 
                careers in the digital space.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-4xl font-bold text-red-600 mb-2">1000+</div>
                <div className="text-gray-700">Students Trained</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-4xl font-bold text-red-600 mb-2">10+</div>
                <div className="text-gray-700">Expert Instructors</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-4xl font-bold text-red-600 mb-2">90%</div>
                <div className="text-gray-700">Success Rate</div>
              </div>
              <div className="text-center p-6 bg-red-50 rounded-xl">
                <div className="text-4xl font-bold text-red-600 mb-2">6+</div>
                <div className="text-gray-700">Years Experience</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our values are centered on integrity, practical learning, student empowerment, continuous growth, and a commitment to real-world career success through "Learning with Earning."
            </p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGraduationCap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Excellence in Education</h3>
              <p className="text-gray-700">
                We are committed to fostering excellence and equity in education by ensuring every learner has the opportunity, support, and resources to reach their highest potential.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Student-Centric Approach</h3>
              <p className="text-gray-700">
                Student-centric learning empowers students by prioritizing their interests, choices, and active participation, with teachers guiding and facilitating personalized, meaningful learning experiences.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaAward className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Industry Relevance</h3>
              <p className="text-gray-700">
                Aligning learning programs with real-world industry needs to equip students with skills and knowledge that ensure their success in the workforce.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaGlobe className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Accessibility</h3>
              <p className="text-gray-700">
                Digital Career Center is committed to ensuring accessibility by providing inclusive digital learning experiences that are usable and beneficial for all individuals, including those with disabilities, following best accessibility standards and practices.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaHeart className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Passion for Learning</h3>
              <p className="text-gray-700">
                Passion for learning drives continuous growth and empowers individuals to gain new skills, adapt to change, and achieve lifelong personal and professional success.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaShieldAlt className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Integrity</h3>
              <p className="text-gray-700">
                We conduct our business with honesty, transparency, and ethical practices, 
                building trust with our students and partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Digital Career Center?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose Digital Career Center for expert-led, industry-aligned training that transforms skills into real job opportunities and lifelong career growth.
            </p>
            <div className="w-24 h-1 bg-red-600 mx-auto mt-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaTrophy className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Proven Track Record</h3>
                <p className="text-gray-700">
                  Digital Career Center has a proven track record of successfully training thousands of students since 2018, with many securing jobs and earning real-world digital skills that meet industry demands.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaUsers className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Expert Instructors</h3>
                <p className="text-gray-700">
                  Digital Career Center instructors are industry experts with advanced qualifications and real-world experience, dedicated to providing practical, hands-on training that ensures student success and career readiness.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaHandshake className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Career Support</h3>
                <p className="text-gray-700">
                  We offer dedicated career support, including personalized coaching, resume building, interview preparation, job placement assistance, and continuous guidance to help students successfully launch and grow their careers.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaGlobe className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Flexible Learning</h3>
                <p className="text-gray-700">
                  Flexible Learning at Digital Career Center means offering courses in online, offline, and hybrid formats, allowing students to learn anytime and anywhere, fitting education into their busy lives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-red-600 to-red-700">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Digital Journey?</h2>
          <p className="text-xl text-red-100 mb-8">
            Join Digital Career Center and unlock your potential with expert training, flexible learning, and career support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Today
            </a>
            <a
              href="/contact"
              className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-400 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

   
      </div>
    </>
  );
}
