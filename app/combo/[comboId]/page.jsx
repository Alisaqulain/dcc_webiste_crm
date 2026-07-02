'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import PageHeader from '@/app/components/ui/PageHeader';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import SectionTitle from '@/app/components/ui/SectionTitle';
import PrimaryButton from '@/app/components/ui/PrimaryButton';
import EmptyState from '@/app/components/ui/EmptyState';

const getThumb = (thumbnail) => {
  if (!thumbnail) return null;
  if (thumbnail.startsWith('http') || thumbnail.startsWith('/')) return thumbnail;
  return `/${thumbnail}`;
};

export default function ComboDetailPage() {
  const { comboId } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [combo, setCombo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/combos/${comboId}`)
      .then((r) => r.json())
      .then((d) => setCombo(d.combo || null))
      .finally(() => setLoading(false));
  }, [comboId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto" />
          <p className="mt-4 text-slate-600">Loading bundle…</p>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <PageHeader
          eyebrow="Combo Bundle"
          title="Bundle Not Found"
          description="This combo bundle could not be found."
        />
        <AnimatedSection className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            title="Bundle unavailable"
            description="It may have been removed or the link is incorrect."
            actionLabel="Browse Courses"
            actionHref="/courses"
          />
        </AnimatedSection>
      </div>
    );
  }

  const thumb = getThumb(combo.thumbnail);

  const handlePurchase = () => {
    if (!session) {
      router.push(`/login?redirect=${encodeURIComponent(`/purchase/combo/${comboId}`)}`);
      return;
    }
    router.push(`/purchase/combo/${comboId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <PageHeader
        eyebrow="Combo Bundle"
        title={combo.title}
        description={combo.description || combo.shortDescription}
      >
        <PrimaryButton href="/courses" variant="secondary" size="sm">
          ← All courses
        </PrimaryButton>
      </PageHeader>

      <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="relative h-56 md:h-72 bg-slate-200">
            {thumb && (
              <Image src={thumb} alt={combo.title} fill className="object-cover" unoptimized />
            )}
            <span className="absolute top-4 right-4 bg-green-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-md">
              Lifetime Access
            </span>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <span className="text-3xl font-bold text-slate-900">
                ₹{Number(combo.price).toLocaleString('en-IN')}
              </span>
              {combo.originalPrice > combo.price && (
                <span className="text-lg text-slate-500 line-through">
                  ₹{Number(combo.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <SectionTitle
              title="Included courses"
              subtitle={`Everything you get with this ${(combo.courseIds || []).length}-course bundle`}
              align="left"
              className="mb-6"
            />
            <ul className="space-y-1 mb-8">
              {(combo.courseIds || []).map((c) => (
                <li
                  key={c._id}
                  className="flex justify-between items-center border-b border-slate-100 py-3 text-sm"
                >
                  <span className="text-slate-800 font-medium">{c.title}</span>
                  <Link href={`/course/${c._id}`} className="text-red-600 hover:underline font-medium">
                    Preview
                  </Link>
                </li>
              ))}
            </ul>

            <PrimaryButton onClick={handlePurchase} size="lg" className="w-full">
              Purchase bundle
            </PrimaryButton>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
