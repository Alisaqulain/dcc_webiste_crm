'use client';

import StaticPageShell from '@/app/components/ui/StaticPageShell';

export default function CookiePolicyPage() {
  return (
    <StaticPageShell
      title="Cookie Policy"
      description="Learn what cookies are, how we use them on our website, and the choices you have."
    >
      <div className="space-y-6 text-gray-700 leading-relaxed">
        <p>
          Welcome to <strong>www.digitalcareercenter.com</strong>! This Cookie Policy explains what cookies are, how we use them on our website, and the choices you have about cookies.
        </p>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">1. What are cookies?</h2>
          <p>
            Cookies are small files stored on your device (like your computer or phone) when you visit a website. They help websites work better, remember your preferences, and provide useful information to the website owner.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How do we use cookies?</h2>
          <p className="mb-3">We use cookies to improve your experience in different ways:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Essential Cookies:</strong> These are necessary for the website to function properly. They allow you to navigate pages and access secure parts of the site. Without them, the site won&apos;t work as expected.
            </li>
            <li>
              <strong>Performance Cookies:</strong> These collect anonymous data about how visitors use the site. This helps us see what&apos;s working well and where we can improve.
            </li>
            <li>
              <strong>Functionality Cookies:</strong> These let the site remember choices you make, like your language or region, to personalize your visit. They can be set by us or trusted third parties.
            </li>
            <li>
              <strong>Advertising Cookies:</strong> These cookies help us show ads that are more relevant to you, prevent the same ad from showing too many times, and measure ad effectiveness.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Your choices about cookies</h2>
          <p>
            You can manage cookies using your browser settings. You can delete cookies already on your device and set your browser to block cookies in the future. Please note that disabling some cookies may affect how well parts of our website work and some features might not function properly.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Updates to this Cookie Policy</h2>
          <p>
            We may update this policy occasionally to reflect changes on our website or legal requirements. Any updates will be posted here, so please check back periodically.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Contact Us</h2>
          <p>
            If you have any questions about our Cookie Policy or how we use cookies, please get in touch with us at <a href="mailto:info@digitalcareercenter.com">info@digitalcareercenter.com</a>.
          </p>
        </div>

        <p>
          By continuing to use our website, you agree to our use of cookies as explained in this policy. If you prefer not to accept cookies, please disable them in your browser or refrain from using our website.
        </p>
      </div>

      <div className="mt-8 text-center not-prose">
        <a
          href="/"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
      </div>
    </StaticPageShell>
  );
}
