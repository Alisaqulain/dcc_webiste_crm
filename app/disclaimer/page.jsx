'use client';

import StaticPageShell from '@/app/components/ui/StaticPageShell';

export default function DisclaimerPage() {
  return (
    <StaticPageShell
      title="Disclaimer"
      description="Important terms for Digital Career Center users and affiliates."
    >
      <div className="space-y-6">
        <div className="border-l-4 border-red-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Course Payment Terms
          </h2>
          <p className="text-gray-700 leading-relaxed">
            When you pay for a course on Digital Career Center, the amount you pay covers only the online course or product you purchase.
          </p>
        </div>

        <div className="border-l-4 border-blue-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Affiliate Program
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Becoming an affiliate with Digital Career Center is completely free. There is no charge or fee to join our affiliate program.
          </p>
        </div>

        <div className="border-l-4 border-yellow-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Earnings Estimates
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We do our best to accurately showcase all the courses and opportunities on our site, including potential earnings. However, any income or earnings mentioned are just estimates. We cannot guarantee that you&apos;ll make a specific amount. Results vary greatly based on individual effort and circumstances.
          </p>
        </div>

        <div className="border-l-4 border-green-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            No Financial Guarantees
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Buying a course or product through our website or via an affiliate link does not guarantee any financial gain or profit.
          </p>
        </div>

        <div className="border-l-4 border-purple-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Personal Responsibility
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Using the information, products, or services from Digital Career Center should be accompanied by your own research and judgment. We are not responsible for your business success or failure that may occur directly or indirectly from using our offerings.
          </p>
        </div>

        <div className="border-l-4 border-indigo-600 pl-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Past Results Disclaimer
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Past results or success stories shared on the site do not guarantee you will achieve similar results. There are risks involved in business and online ventures that can&apos;t be predicted. Ultimately, your success depends on your own actions.
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Company Information
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Digital Career Center is a brand operated by <strong>Digital Career Educational Society</strong>.
          </p>
        </div>
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
