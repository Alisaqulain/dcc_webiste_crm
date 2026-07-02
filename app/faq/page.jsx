'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaSearch, FaQuestionCircle } from 'react-icons/fa';
import StaticPageShell from '@/app/components/ui/StaticPageShell';

const faqData = [
  {
    category: "General Information",
    questions: [
      {
        question: "What is Digital Career Center?",
        answer: "Digital Career Center is a professional training institute in Muzaffarnagar that provides both online and offline computer courses, IT skill development, and work-from-home earning opportunities in the computer sector."
      },
      {
        question: "Where is your center located?",
        answer: "Our offline training center is located in Muzaffarnagar, Uttar Pradesh. Online students can join from anywhere in India."
      },
      {
        question: "Who can join Digital Career Center training programs?",
        answer: "Anyone who wants to build computer and IT skills can join, including students, job seekers, housewives, professionals, and business owners who want to improve digital knowledge."
      }
    ]
  },
  {
    category: "Courses & Programs",
    questions: [
      {
        question: "What type of courses do you provide?",
        answer: "We provide a wide range of computer training programs, including:\n• Basic to Advanced Computer Courses\n• Digital Marketing & SEO\n• Graphic Design\n• Digital Marketing\n• Digital Starter Pack [DSP]\n• Junior Computer Basic [JCB]\n• MS Office, Excel, and Typing Training\n• Website Development & Programming (HTML, CSS, PHP, etc.)\n• Online Earning & Freelancing Skill Training"
      },
      {
        question: "What is the duration of your courses?",
        answer: "The course duration depends on the program. Basic computer training may take 2–3 months, while advanced IT and digital courses can range from 3–6 months. Short-term crash courses are also available."
      },
      {
        question: "Is prior computer knowledge required?",
        answer: "No prior knowledge is required for basic courses. For advanced programs, some basic familiarity with computers is recommended but not mandatory."
      },
      {
        question: "Do you provide demo classes?",
        answer: "Yes, we provide free demo sessions so that students can understand our teaching quality before enrolling."
      }
    ]
  },
  {
    category: "Learning Options",
    questions: [
      {
        question: "Are the courses available online as well as offline?",
        answer: "Yes, our courses are available in both modes:\n• Offline classroom training at our Muzaffarnagar campus\n• Online live classes and recorded modules for students across India"
      },
      {
        question: "Do you provide work-from-home opportunities?",
        answer: "Yes, along with training, Digital Career Center guides students in finding genuine work-from-home projects and online earning opportunities in the computer and IT field."
      },
      {
        question: "Can I earn online after your training?",
        answer: "Yes, we train you in essential skills like freelancing, digital marketing, online data work, and more. Many of our students start earning from home after completing the course."
      }
    ]
  },
  {
    category: "Benefits & Support",
    questions: [
      {
        question: "What are the benefits of joining Digital Career Center?",
        answer: "• Practical & career-focused training\n• Affordable course fees\n• Online and offline learning options\n• Work-from-home earning guidance\n• Industry-relevant projects and assignments\n• Certification after successful completion"
      },
      {
        question: "Will I get a certificate after completing the course?",
        answer: "Yes, we provide a course completion certificate after you finish training, which can help you in jobs, freelancing, and professional growth."
      },
      {
        question: "Do you provide job placement support?",
        answer: "Our focus is on skill development and freelancing guidance, but we also assist students with interview preparation, resume support, and job-oriented training to help them grab better career opportunities."
      }
    ]
  },
  {
    category: "Enrollment & Fees",
    questions: [
      {
        question: "How can I enroll in a course?",
        answer: "You can register directly through our website, visit our Muzaffarnagar training center, or contact us on WhatsApp/Phone to book your seat in any program."
      },
      {
        question: "How much do your courses cost?",
        answer: "Our courses are designed to be budget-friendly. Fees vary depending on the program and duration. You can contact us to get a detailed fee structure."
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Generate FAQ schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.flatMap(category => 
      category.questions.map(q => ({
        "@type": "Question",
        "name": q.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": q.answer
        }
      }))
    )
  };

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredData = faqData.filter(category => 
    selectedCategory === 'All' || category.category === selectedCategory
  ).map(category => ({
    ...category,
    questions: category.questions.filter(question =>
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const categories = ['All', ...faqData.map(cat => cat.category)];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      <StaticPageShell
        title="Frequently Asked Questions"
        description="Find answers to common questions about courses, enrollment, learning options, and support at Digital Career Center."
      >
      <div className="not-prose">
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <FaQuestionCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No questions found</h3>
              <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
            </div>
          ) : (
            filteredData.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4">
                  <h2 className="text-2xl font-bold text-gray-800">{category.category}</h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {category.questions.map((item, questionIndex) => {
                    const isOpen = openItems[`${categoryIndex}-${questionIndex}`];
                    return (
                      <div key={questionIndex} className="border-b border-gray-200 last:border-b-0">
                        <button
                          onClick={() => toggleItem(categoryIndex, questionIndex)}
                          className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-800 pr-4">
                              {item.question}
                            </h3>
                            {isOpen ? (
                              <FaChevronUp className="w-5 h-5 text-red-600 flex-shrink-0" />
                            ) : (
                              <FaChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                        
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                              {item.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
          <p className="text-red-100 mb-6">
            Can't find the answer you're looking for? Our team is here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="tel:+919876543210"
              className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-400 transition-colors"
            >
              Call Now
            </a>
          </div>
        </div>
      </div>
      </div>
      </StaticPageShell>
    </>
  );
}
