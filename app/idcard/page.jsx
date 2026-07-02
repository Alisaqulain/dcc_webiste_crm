'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa';
import PageHeader from '@/app/components/ui/PageHeader';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import SectionTitle from '@/app/components/ui/SectionTitle';
import PrimaryButton from '@/app/components/ui/PrimaryButton';

function IDCardDownloadForm() {
  const [rollNumber, setRollNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rollNumber.trim()) {
      setIsLoading(true);
      router.push(`/idcard/download/${rollNumber.trim()}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={rollNumber}
          onChange={(e) => setRollNumber(e.target.value)}
          placeholder="Enter your roll number"
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

const cardFeatures = [
  { color: 'bg-red-500', text: 'Official DCC branding and logo' },
  { color: 'bg-blue-500', text: 'QR code for quick verification' },
  { color: 'bg-emerald-500', text: 'Student photo placeholder' },
  { color: 'bg-violet-500', text: 'Unique student identification' },
];

const usageInstructions = [
  'Present this card at DCC events and workshops',
  'Use for course access and verification',
  'Keep the QR code accessible for quick scanning',
  'Contact support if you need a replacement',
];

export default function IDCardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Student Resources"
        title="Student ID Card"
        description="Your official DCC student identification card. Keep this card with you during all DCC activities and courses."
      />

      <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex justify-center mb-10">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 hover:shadow-xl transition-shadow duration-300">
            <Image
              src="/id.jpg"
              alt="DCC Student ID Card"
              width={360}
              height={540}
              className="rounded-xl shadow-md mx-auto"
              priority
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center border border-red-100">
              <FaIdCard className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">ID Card Information</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Card Features</h4>
              <ul className="space-y-3">
                {cardFeatures.map((item) => (
                  <li key={item.text} className="flex items-center gap-3 text-slate-600 text-sm">
                    <span className={`w-2 h-2 ${item.color} rounded-full flex-shrink-0`} />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide">Usage Instructions</h4>
              <ul className="space-y-3">
                {usageInstructions.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-slate-600 text-sm">
                    <span className="text-red-500 mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 mb-8">
          <SectionTitle
            title="Download Your ID Card"
            subtitle="Enter your roll number to download your ID card"
            className="mb-6"
          />
          <IDCardDownloadForm />
        </div>
      </AnimatedSection>

      <AnimatedSection
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-red-950 py-16 md:py-20"
        delay={0.1}
      >
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <SectionTitle
            title="Need a Physical Copy?"
            subtitle="Download and print your ID card for offline use"
            className="[&_h2]:text-white [&_p]:text-slate-300 [&_div]:bg-red-500"
          />
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
            <PrimaryButton size="lg">Download PDF</PrimaryButton>
            <PrimaryButton
              variant="secondary"
              size="lg"
              className="!bg-white/10 !text-white !border-white/30 hover:!bg-white/20"
            >
              Print Card
            </PrimaryButton>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
