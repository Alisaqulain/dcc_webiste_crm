'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import CoursePayCard from '../../../components/CoursePayCard';
import PageHeader from '@/app/components/ui/PageHeader';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import SectionTitle from '@/app/components/ui/SectionTitle';
import PrimaryButton from '@/app/components/ui/PrimaryButton';
import EmptyState from '@/app/components/ui/EmptyState';

function PurchaseComboContent() {
  const params = useParams();
  const comboId = params.comboId;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [combo, setCombo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login?redirect=' + encodeURIComponent(`/purchase/combo/${comboId}`));
      return;
    }
    fetch(`/api/combos/${comboId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.combo) setCombo(d.combo);
        else setError(d.message || 'Combo not found');
      })
      .catch(() => setError('Error loading combo'))
      .finally(() => setIsLoading(false));
  }, [session, status, comboId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading bundle…</p>
        </div>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader
          eyebrow="Checkout"
          title="Bundle Not Found"
          description={error || 'This combo bundle could not be loaded.'}
        />
        <AnimatedSection className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            title="Unable to load checkout"
            description="The bundle may have been removed or the link is incorrect."
            actionLabel="Back to Courses"
            actionHref="/courses"
          />
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Combo Bundle"
        title={combo.title}
        description={combo.shortDescription || 'Complete payment to unlock all included courses.'}
      >
        <PrimaryButton href="/courses" variant="secondary" size="sm">
          ← All courses
        </PrimaryButton>
      </PageHeader>

      <AnimatedSection className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-slate-100">
            <SectionTitle
              title="What's included"
              subtitle={`${(combo.courseIds || []).length} course${(combo.courseIds || []).length === 1 ? '' : 's'} in this bundle`}
              align="left"
              className="mb-6"
            />
            <ul className="space-y-2">
              {(combo.courseIds || []).map((c) => (
                <li
                  key={c._id}
                  className="flex items-center gap-2 text-sm text-slate-700 py-2 border-b border-slate-50 last:border-0"
                >
                  <span className="text-green-600 font-bold">✓</span>
                  {c.title}
                </li>
              ))}
            </ul>
            {combo.originalPrice > combo.price && (
              <p className="mt-4 text-sm text-slate-500 line-through">
                ₹{Number(combo.originalPrice).toLocaleString('en-IN')}
              </p>
            )}
          </div>
          <div className="p-6 sm:p-8 bg-slate-50/50">
            <SectionTitle
              title="Complete your purchase"
              subtitle="Pay securely with Razorpay to unlock the full bundle."
              align="left"
              className="mb-6 md:mb-8"
            />
            <CoursePayCard
              combo={combo}
              onSuccess={() => router.push('/courses?purchased=1')}
            />
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}

export default function PurchaseComboPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
        </div>
      }
    >
      <PurchaseComboContent />
    </Suspense>
  );
}
