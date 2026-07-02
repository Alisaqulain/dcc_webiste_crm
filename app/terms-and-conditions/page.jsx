'use client';

import { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaFileContract, FaUser, FaCookieBite, FaCopyright, FaComment, FaLink, FaShieldAlt, FaExclamationTriangle, FaEye, FaCog, FaGavel } from 'react-icons/fa';
import StaticPageShell from '@/app/components/ui/StaticPageShell';

const termsSections = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: FaFileContract,
    content: `Welcome to www.digitalcareercenter.com! We're glad you're here. Before you get started, we'd like to share a few important things about using our website. By visiting or using our site, you agree to these terms — so please take a moment to read through them. If you don't agree with something, that's okay, but we ask that you don't continue using our site.`
  },
  {
    id: 'who-is-who',
    title: "Who's Who",
    icon: FaUser,
    content: `When we say "you" or "your," we mean you — the visitor or user on this site. When we say "we," "us," or "our," we're talking about Digital Career Center. Together, you and us are "the parties" involved in this agreement.`
  },
  {
    id: 'cookies',
    title: "Cookies — What's That?",
    icon: FaCookieBite,
    content: `Cookies are small files on your computer that help make your experience smoother and friendlier. When you use our site, you agree that we can use cookies based on our Privacy Policy. These little helpers remember your preferences and help things run better. Some of our trusted partners might use cookies, too.`
  },
  {
    id: 'ownership',
    title: 'Ownership of Content',
    icon: FaCopyright,
    content: `Everything you see on our site — the words, images, videos, and more — belongs to us or the people who've given us permission to use them. You're welcome to browse, learn, and use the content for your personal growth, but please don't copy, sell, or share it without asking us first.`
  },
  {
    id: 'sharing-thoughts',
    title: 'Sharing Your Thoughts',
    icon: FaComment,
    content: `We love hearing from you! Some parts of our site let you share comments or feedback. Just a heads-up — your comments are your own, and they don't necessarily reflect what we think. We don't preview all comments ahead of time, but if something seems off, offensive, or breaks the rules, we might remove it.`,
    additional: `When you post something here, you're promising that it's your own work, it doesn't hurt anyone's rights, and it's respectful. By sharing, you're also letting us use your comments to help make the site better.`
  },
  {
    id: 'linking',
    title: 'Linking to Us',
    icon: FaLink,
    content: `We're happy when other sites want to link to us, especially if they're official organizations like government offices, news sites, or educational groups. If that's you, you don't need special permission — just make sure the link makes sense and isn't misleading.`,
    additional: `If you represent a business or community site and want to link to us, please drop us a line at info@digitalcareercenter.com. Tell us a bit about your site and how you want to link. We'll get back to you within a couple of weeks.`
  },
  {
    id: 'no-frames',
    title: 'No Sneaky Frames',
    icon: FaExclamationTriangle,
    content: `Please don't use iframes or other codes to frame our website and change how it looks or feels, unless you've got our okay in writing.`
  },
  {
    id: 'external-content',
    title: 'Content on Other Sites',
    icon: FaEye,
    content: `We're not responsible for what's on other websites that link to us. If you run a website, make sure your content is respectful and legal — and be ready to protect us if there's ever an issue.`
  },
  {
    id: 'privacy',
    title: 'Your Privacy',
    icon: FaShieldAlt,
    content: `We care about your privacy. Please read our Privacy Policy to understand how we handle your info.`
  },
  {
    id: 'changes',
    title: 'Changes and Updates',
    icon: FaCog,
    content: `We might update these terms now and then. If you keep using our site after changes, that means you accept the new terms. We can also ask you to remove any links to our site at any time.`
  },
  {
    id: 'reporting',
    title: 'Seeing a Problem?',
    icon: FaExclamationTriangle,
    content: `If you ever see a link on our site that seems inappropriate or wrong, just let us know. We'll look into it, but can't promise we'll remove every link or send you a note back.`
  },
  {
    id: 'using-site',
    title: 'Using Our Site',
    icon: FaFileContract,
    content: `We try to keep our website accurate and running smoothly, but we can't promise it's perfect or always available. Use it at your own risk.`
  },
  {
    id: 'liability',
    title: 'Our Promise and Limits',
    icon: FaGavel,
    content: `We provide our site and services "as is," without any promises beyond what the law requires. We're not liable for damages or problems that might arise from using the site except in very limited cases like serious injury or fraud.`
  }
];

export default function TermsAndConditionsPage() {
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
      title="Terms and Conditions"
      description="Please read these terms carefully before using our website. By using our site, you agree to be bound by these terms and conditions."
    >
      <div className="not-prose">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {termsSections.map((section, index) => {
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
              {/* Terms Sections */}
              {termsSections.map((section, index) => {
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
                <h3 className="text-2xl font-bold mb-4">Questions About These Terms?</h3>
                <p className="text-red-100 mb-6">
                  If you have any questions about these Terms and Conditions or need clarification 
                  on any section, please don't hesitate to contact us.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/contact"
                    className="bg-white text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
                  >
                    Contact Us
                  </a>
                  <a
                    href="mailto:legal@digitalcareercenter.com"
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-400 transition-colors text-center"
                  >
                    Email Legal Team
                  </a>
                </div>
              </div>

              {/* Related Policies */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Related Policies</h3>
                <p className="text-gray-700 mb-6">
                  For more information about how we handle your data and protect your privacy, 
                  please review our related policies:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <a
                    href="/privacy-policy"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaShieldAlt className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-gray-800">Privacy Policy</h4>
                      <p className="text-sm text-gray-600">How we collect and use your data</p>
                    </div>
                  </a>
                  <a
                    href="/faq"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <FaFileContract className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-gray-800">FAQ</h4>
                      <p className="text-sm text-gray-600">Frequently asked questions</p>
                    </div>
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
                <p className="text-sm text-gray-500 mt-2">
                  These terms are effective as of the date above and will remain in effect 
                  until modified or updated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaticPageShell>
  );
}
