'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaAward, FaCheckCircle } from 'react-icons/fa';
import { certificateDownloadPath } from '@/lib/certificateDownloadPath';
import PageHeader from '@/app/components/ui/PageHeader';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import SectionTitle from '@/app/components/ui/SectionTitle';
import PrimaryButton from '@/app/components/ui/PrimaryButton';

function CertificateDownloadForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rollNumber.trim()) {
      setIsLoading(true);
      router.push(certificateDownloadPath(rollNumber.trim()));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="e.g. 00781/DCC55 or DCC55"
          className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
          required
        />
        <PrimaryButton type="submit" disabled={isLoading} size="lg">
          {isLoading ? 'Loading…' : 'Download'}
        </PrimaryButton>
      </div>
    </form>
  );
}

const benefits = [
  {
    step: '1',
    title: 'Industry Recognition',
    description: 'Our certificates are recognized by leading companies and help you stand out in the job market.',
  },
  {
    step: '2',
    title: 'Skill Validation',
    description: 'Proves your competency in digital marketing and related technologies to potential employers.',
  },
  {
    step: '3',
    title: 'Career Advancement',
    description: 'Opens doors to better job opportunities and higher salary prospects.',
  },
];

const steps = [
  { step: '1', title: 'Enroll in Course', description: 'Choose from our comprehensive course packages that match your career goals.', color: 'blue' },
  { step: '2', title: 'Complete Training', description: 'Attend all sessions, complete assignments, and participate in live projects.', color: 'blue' },
  { step: '3', title: 'Pass Assessment', description: 'Successfully complete the final assessment to demonstrate your skills.', color: 'blue' },
  { step: '✓', title: 'Receive Certificate', description: 'Get your industry-recognized certificate and boost your professional profile.', color: 'green' },
];

export default function CertificatePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Credentials"
        title="Our Certificate"
        description="Digital Career Center provides industry-recognized certificates upon successful completion of our courses. These certificates validate your skills and enhance your professional credibility."
      />

      <AnimatedSection className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 md:p-12 mb-10">
          <SectionTitle
            title="Digital Career Center Certificate"
            subtitle="Industry-Recognized Professional Certification"
            className="mb-8"
          />

          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-4 sm:p-6 border border-slate-200">
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src="/certificate1.jpg"
                  alt="Digital Career Center Certificate"
                  fill
                  className="object-contain rounded-xl shadow-lg"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </div>
            </div>

            <div className="mt-8 bg-red-50 border border-red-100 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 text-center">Certificate Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                {[
                  'Industry-recognized certification',
                  'Validates your digital skills',
                  'Enhances professional credibility',
                  'Boosts career opportunities',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
                <FaAward className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Why Our Certificate Matters</h3>
            </div>
            <div className="space-y-5">
              {benefits.map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-50 border border-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <SectionTitle title="How to Earn Your Certificate" align="left" className="mb-6 [&_h2]:text-xl" />
            <div className="space-y-5">
              {steps.map((item) => (
                <div key={item.title} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                      item.color === 'green'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                        : 'bg-blue-50 border-blue-100 text-blue-600'
                    }`}
                  >
                    <span className="font-bold text-sm">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 mb-10">
          <SectionTitle
            title="Download Your Certificate"
            subtitle="Enter your roll number to download your certificate"
            className="mb-6"
          />
          <CertificateDownloadForm />
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 py-16 md:py-20"
        delay={0.1}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Ready to Earn Your Certificate?"
            subtitle="Join thousands of students who have already earned their Digital Career Center certification."
            className="[&_h2]:text-white [&_p]:text-slate-300 [&_div]:bg-red-500"
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <PrimaryButton href="/BronzeBundle" size="lg">
              View Courses
            </PrimaryButton>
            <PrimaryButton
              href="/contact"
              variant="secondary"
              size="lg"
              className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20"
            >
              Contact Us
            </PrimaryButton>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
