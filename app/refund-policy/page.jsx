'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaMoneyBillWave, FaClock, FaEnvelope, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaFileInvoice, FaUser, FaCalendarAlt, FaComment, FaShieldAlt } from 'react-icons/fa';
import StaticPageShell from '@/app/components/ui/StaticPageShell';

const refundSections = [
  {
    id: 'overview',
    title: 'Refund Policy Overview',
    icon: FaMoneyBillWave,
    content: `At Digital Career Center, we want you to be happy with your purchase. Here's how our refund policy works:`
  },
  {
    id: 'time-limit',
    title: '2-Hour Refund Window',
    icon: FaClock,
    content: `Refunds are available only if you request them within 2 hours of purchasing any course package from us.`,
    warning: true
  },
  {
    id: 'fees',
    title: 'Refund Fees',
    icon: FaMoneyBillWave,
    content: `Please note that a 2% payment gateway fee and a 5% processing fee will be deducted from the refund amount.`,
    details: [
      '2% payment gateway fee',
      '5% processing fee',
      'Total deduction: 7% of the original amount'
    ]
  },
  {
    id: 'no-refund-after',
    title: 'No Refunds After 2 Hours',
    icon: FaTimesCircle,
    content: `No refunds will be given for purchases made directly on the Digital Career Center website or through an affiliate link after 2 hours from the time of purchase, under any circumstances.`,
    warning: true
  },
  {
    id: 'refund-request',
    title: 'How to Request a Refund',
    icon: FaEnvelope,
    content: `To request a refund, please email us at info@digitalcareercenter.com using the registered email address and include the following details:`,
    requirements: [
      {
        icon: FaUser,
        title: 'Full Name',
        description: 'Your complete name as registered'
      },
      {
        icon: FaEnvelope,
        title: 'Registered Email ID',
        description: 'The email address used for registration'
      },
      {
        icon: FaCalendarAlt,
        title: 'Date of Registration',
        description: 'When you registered for the course'
      },
      {
        icon: FaFileInvoice,
        title: 'Screenshot of Payment Invoice',
        description: 'Showing date and time of purchase'
      },
      {
        icon: FaComment,
        title: 'Reason for Refund',
        description: 'Why you are requesting a refund'
      }
    ],
    warning: 'Refund requests without all of these details will not be processed.'
  },
  {
    id: 'non-refundable',
    title: 'Non-Refundable Items',
    icon: FaExclamationTriangle,
    content: `Payments made for any membership plans, workshops, or special packages labeled as non-refundable on our website cannot be refunded.`,
    warning: true
  },
  {
    id: 'contact-method',
    title: 'Refund Request Method',
    icon: FaShieldAlt,
    content: `Remember, the refund process can only be initiated by emailing us at info@digitalcareercenter.com. Please do not send refund requests via other channels.`
  }
];

export default function RefundPolicyPage() {
  const [openSections, setOpenSections] = useState({});
  const [activeSection, setActiveSection] = useState('');

  const toggleSection = (sectionId) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  return (
    <StaticPageShell
      title="Refund Policy"
      description="We want you to be completely satisfied with your purchase. Please review our refund policy carefully before making a purchase."
    >
      <div className="not-prose">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {refundSections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        activeSection === section.id
                          ? 'bg-red-100 text-red-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Important Notice */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                <div className="flex items-center">
                  <FaExclamationTriangle className="w-6 h-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Important Notice</h3>
                    <p className="text-yellow-700 mt-1">
                      Refunds are only available within 2 hours of purchase. Please read all terms carefully before making a purchase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Refund Sections */}
              {refundSections.map((section, index) => {
                const Icon = section.icon;
                const isOpen = openSections[section.id];
                
                return (
                  <div key={section.id} id={section.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={`w-full px-8 py-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 ${
                        section.warning ? 'border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Icon className={`w-6 h-6 flex-shrink-0 ${section.warning ? 'text-red-600' : 'text-red-600'}`} />
                          <h2 className="text-xl font-bold text-gray-800">
                            {section.title}
                          </h2>
                          {section.warning && (
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                              Important
                            </span>
                          )}
                        </div>
                        {isOpen ? (
                          <FaChevronUp className="w-5 h-5 text-red-600 flex-shrink-0" />
                        ) : (
                          <FaChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                    
                    {isOpen && (
                      <div className="px-8 pb-6 border-t border-gray-200">
                        <div className="pt-6">
                          <p className="text-gray-700 leading-relaxed mb-4">
                            {section.content}
                          </p>
                          
                          {section.details && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                              <h4 className="font-semibold text-gray-800 mb-2">Fee Breakdown:</h4>
                              <ul className="space-y-1">
                                {section.details.map((detail, index) => (
                                  <li key={index} className="flex items-center gap-2 text-gray-700">
                                    <span className="text-red-600 font-bold">•</span>
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {section.requirements && (
                            <div className="space-y-4 mb-4">
                              <h4 className="font-semibold text-gray-800 mb-3">Required Information:</h4>
                              {section.requirements.map((req, index) => {
                                const ReqIcon = req.icon;
                                return (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <ReqIcon className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                                    <div>
                                      <h5 className="font-medium text-gray-800">{req.title}</h5>
                                      <p className="text-sm text-gray-600">{req.description}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {section.warning && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-center gap-2">
                                <FaExclamationTriangle className="w-5 h-5 text-red-600" />
                                <p className="text-red-800 font-medium">{section.warning}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Refund Request Form */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Request a Refund?</h3>
                <p className="text-blue-100 mb-6">
                  Make sure you have all the required information before submitting your refund request.
                </p>
                <div className="bg-white bg-opacity-10 rounded-lg p-6 mb-6">
                  <h4 className="font-semibold mb-3">Quick Checklist:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="w-4 h-4 text-green-300" />
                      <span>Within 2 hours of purchase</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="w-4 h-4 text-green-300" />
                      <span>All required information ready</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheckCircle className="w-4 h-4 text-green-300" />
                      <span>Payment invoice screenshot available</span>
                    </li>
                  </ul>
                </div>
                <a
                  href="mailto:info@digitalcareercenter.com?subject=Refund Request&body=Please include all required information as per our refund policy."
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
                >
                  <FaEnvelope className="w-4 h-4" />
                  Send Refund Request
                </a>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Need Help?</h3>
                <p className="text-gray-700 mb-6">
                  If you have questions about our refund policy or need assistance with your request, 
                  please don't hesitate to contact us.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FaEnvelope className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Email Support</h4>
                      <p className="text-sm text-gray-600">info@digitalcareercenter.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <FaClock className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Response Time</h4>
                      <p className="text-sm text-gray-600">Within 24-48 hours</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              <div className="bg-gray-100 rounded-2xl p-6 text-center">
                <p className="text-gray-600">
                  <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This refund policy is effective as of the date above and applies to all purchases made after this date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaticPageShell>
  );
}
