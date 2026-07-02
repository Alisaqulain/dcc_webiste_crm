'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaShieldAlt, FaLock, FaEye, FaUserShield, FaCookieBite, FaGavel } from 'react-icons/fa';
import StaticPageShell from '@/app/components/ui/StaticPageShell';

const privacySections = [
  {
    id: 'scope',
    title: 'Scope',
    icon: FaEye,
    content: `This Privacy Policy applies only to information collected through our website and is valid for visitors regarding the data they share or that we collect online. It does not cover information collected offline or through other channels.`
  },
  {
    id: 'consent',
    title: 'Consent',
    icon: FaShieldAlt,
    content: `By using our site, you consent to this Privacy Policy and its terms.`
  },
  {
    id: 'information-collection',
    title: 'Information We Collect',
    icon: FaUserShield,
    content: `We clarify what information you provide us at the time of collection, such as:`,
    list: [
      'When contacting us, we may collect your name, email, phone number, message details, or any other data you share.',
      'When registering an account, information like name, company, address, email, and phone number may be requested.'
    ]
  },
  {
    id: 'information-usage',
    title: 'How We Use Information',
    icon: FaLock,
    content: `The information is used to:`,
    list: [
      'Operate and enhance our website',
      'Personalize your experience',
      'Understand user interaction with our site',
      'Innovate new features and services',
      'Communicate updates, offers, or support directly or via partners',
      'Send emails about courses and programs',
      'Prevent fraud and maintain security'
    ]
  },
  {
    id: 'log-files',
    title: 'Log Files',
    icon: FaEye,
    content: `We use log files to analyze traffic and administer the website. This may include IP addresses, browser type, ISP, date/time, referrer/exit pages, and click counts—all anonymized and unlinked to personal identity.`
  },
  {
    id: 'cookies',
    title: 'Cookies and Web Beacons',
    icon: FaCookieBite,
    content: `Our site uses cookies to save preferences and track visited pages to optimize user experience. For more on cookies, see What Are Cookies.`
  },
  {
    id: 'google-dart',
    title: 'Google DoubleClick DART Cookie',
    icon: FaCookieBite,
    content: `Google uses DART cookies to deliver targeted ads based on your visits to our site. You can opt out via Google Ads Privacy Policy.`
  },
  {
    id: 'advertising-partners',
    title: 'Advertising Partners',
    icon: FaEye,
    content: `Third-party advertisers may use cookies or web beacons to track ad performance. Digital Career Center does not control these cookies.`
  },
  {
    id: 'third-party-policies',
    title: 'Third-Party Privacy Policies',
    icon: FaShieldAlt,
    content: `This policy does not apply to third-party ads or websites. Review their policies for more info and opt-out choices.`
  },
  {
    id: 'cookie-management',
    title: 'Cookie Management',
    icon: FaCookieBite,
    content: `Cookies can be disabled via browser settings; consult your browser's help resources.`
  },
  {
    id: 'ccpa-rights',
    title: 'CCPA Rights',
    icon: FaGavel,
    content: `California residents can:`,
    list: [
      'Request data disclosures',
      'Request deletion of personal data',
      'Request non-sale of personal data'
    ],
    additional: `Contact us to exercise these rights. We will respond within 30 days.`
  },
  {
    id: 'gdpr-rights',
    title: 'GDPR Rights',
    icon: FaGavel,
    content: `EU users may request:`,
    list: [
      'Access to their data',
      'Correction of inaccurate data',
      'Data deletion under conditions',
      'Processing restrictions',
      'Objection to processing',
      'Data portability'
    ],
    additional: `Contact us to exercise rights with a response timeframe of one month.`
  },
  {
    id: 'children-privacy',
    title: "Children's Privacy",
    icon: FaUserShield,
    content: `We prioritize children's safety online. Children under 13 should not submit personal info on our site. If discovered, contact us to remove it immediately.`
  }
];

export default function PrivacyPolicyPage() {
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
      title="Privacy Policy"
      description="At www.digitalcareercenter.com, protecting our visitors' privacy is a key priority. This Privacy Policy explains the kinds of information collected, how it is recorded, and how we use it."
    >
      <div className="not-prose">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {privacySections.map((section, index) => {
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
              {/* Introduction */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center gap-3 mb-4">
                  <FaShieldAlt className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Introduction</h2>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this policy, please feel free to contact us.
                </p>
              </div>

              {/* Privacy Sections */}
              {privacySections.map((section, index) => {
                const Icon = section.icon;
                const isOpen = openSections[section.id];
                
                return (
                  <div key={section.id} id={section.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full px-8 py-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Icon className="w-6 h-6 text-red-600 flex-shrink-0" />
                          <h2 className="text-xl font-bold text-gray-800">
                            {section.title}
                          </h2>
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
                          
                          {section.list && (
                            <ul className="space-y-2 mb-4">
                              {section.list.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start gap-2">
                                  <span className="text-red-600 font-bold mt-1">•</span>
                                  <span className="text-gray-700">{item}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          {section.additional && (
                            <p className="text-gray-700 leading-relaxed">
                              {section.additional}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Contact Information */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Questions About This Policy?</h3>
                <p className="text-red-100 mb-6">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/contact"
                    className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
                  >
                    Contact Us
                  </a>
                  <a
                    href="mailto:privacy@digitalcareercenter.com"
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-400 transition-colors text-center"
                  >
                    Email Us
                  </a>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaticPageShell>
  );
}
