'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import CoursePayCard from '../../../components/CoursePayCard';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Combo not found'}</p>
          <Link href="/courses" className="text-red-600 hover:underline">
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/courses" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← All courses
        </Link>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-600">Combo bundle</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{combo.title}</h1>
            {combo.shortDescription && (
              <p className="text-gray-600 mt-2">{combo.shortDescription}</p>
            )}
            <ul className="mt-4 space-y-1 text-sm text-gray-700">
              {(combo.courseIds || []).map((c) => (
                <li key={c._id}>✓ {c.title}</li>
              ))}
            </ul>
            {combo.originalPrice > combo.price && (
              <p className="mt-2 text-sm text-gray-500 line-through">₹{combo.originalPrice}</p>
            )}
          </div>
          <div className="p-6">
            <CoursePayCard
              combo={combo}
              onSuccess={() => router.push('/courses?purchased=1')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseComboPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <PurchaseComboContent />
    </Suspense>
  );
}
