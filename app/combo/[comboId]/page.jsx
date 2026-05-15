'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-gray-600">Combo not found.</p>
      </div>
    );
  }

  const thumb = getThumb(combo.thumbnail);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/courses" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← All courses
        </Link>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="relative h-56 md:h-72 bg-gray-200">
            {thumb && (
              <Image src={thumb} alt={combo.title} fill className="object-cover" unoptimized />
            )}
            <span className="absolute top-4 right-4 bg-green-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Lifetime Access
            </span>
          </div>
          <div className="p-6 md:p-8">
            <span className="text-xs font-semibold uppercase text-red-600">Combo bundle</span>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{combo.title}</h1>
            <p className="text-gray-600 mt-3">{combo.description}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="text-3xl font-bold text-gray-900">
                ₹{Number(combo.price).toLocaleString('en-IN')}
              </span>
              {combo.originalPrice > combo.price && (
                <span className="text-lg text-gray-500 line-through">
                  ₹{Number(combo.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <h2 className="text-lg font-semibold mt-8 mb-3">Included courses</h2>
            <ul className="space-y-2">
              {(combo.courseIds || []).map((c) => (
                <li key={c._id} className="flex justify-between border-b border-gray-100 py-2 text-sm">
                  <span>{c.title}</span>
                  <Link href={`/course/${c._id}`} className="text-red-600 hover:underline">
                    Preview
                  </Link>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => {
                if (!session) {
                  router.push(`/login?redirect=${encodeURIComponent(`/purchase/combo/${comboId}`)}`);
                  return;
                }
                router.push(`/purchase/combo/${comboId}`);
              }}
              className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg"
            >
              Purchase bundle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
