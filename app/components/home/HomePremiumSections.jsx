'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedSection from '@/app/components/ui/AnimatedSection';
import AnimatedItem from '@/app/components/ui/AnimatedItem';
import SectionTitle from '@/app/components/ui/SectionTitle';
import PrimaryButton from '@/app/components/ui/PrimaryButton';
import StatCard from '@/app/components/ui/StatCard';
import { SingleCourseCard } from '@/app/components/courses/CourseCatalogCards';

export function HomeStats() {
  return (
    <AnimatedSection className="py-12 md:py-16 px-4 sm:px-6 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard value="2018" label="Training since" delay={0} />
        <StatCard value="25+" label="Expert courses" delay={0.05} />
        <StatCard value="100%" label="Practical focus" delay={0.1} />
        <StatCard value="Lifetime" label="Course access" delay={0.15} />
      </div>
    </AnimatedSection>
  );
}

export function HomeCategories() {
  const categories = [
    { name: 'Digital Marketing', icon: '📣', href: '/courses' },
    { name: 'Web Development', icon: '💻', href: '/courses' },
    { name: 'SEO', icon: '🔍', href: '/courses' },
    { name: 'Video Editing', icon: '🎬', href: '/courses' },
    { name: 'Data & AI', icon: '🤖', href: '/courses' },
    { name: 'Business Skills', icon: '📈', href: '/courses' },
  ];

  return (
    <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <SectionTitle
          title="Explore Course Categories"
          subtitle="Choose your path — from beginner-friendly starter packs to advanced professional programs."
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat, index) => (
            <AnimatedItem key={cat.name} delay={index * 0.05}>
            <Link
              href={cat.href}
              className="text-center p-6 dcc-card-hover group block h-full"
            >
              <span className="text-3xl mb-3 block">{cat.icon}</span>
              <span className="text-sm font-semibold text-slate-800 group-hover:text-red-600 transition-colors">
                {cat.name}
              </span>
            </Link>
            </AnimatedItem>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}

export function HomeFeaturedCourses() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses?published=true&limit=6&sortBy=popular')
      .then((r) => r.json())
      .then((d) => setCourses((d.courses || []).slice(0, 6)))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || courses.length === 0) return null;

  return (
    <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionTitle
          title="Featured Courses"
          subtitle="Popular programs chosen by learners — start learning today with lifetime access."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
          {courses.map((course, index) => (
            <AnimatedItem key={course._id} delay={index * 0.08}>
            <SingleCourseCard
              course={course}
              isOwned={false}
              session={null}
              onPurchase={(c) => router.push(`/purchase/${c._id}`)}
              onViewMore={() => {}}
            />
            </AnimatedItem>
          ))}
        </div>
        <div className="text-center mt-10">
          <PrimaryButton href="/courses" variant="secondary">
            View all courses
          </PrimaryButton>
        </div>
      </div>
    </AnimatedSection>
  );
}

const FAQ_ITEMS = [
  {
    q: 'Do I get lifetime access after purchase?',
    a: 'Yes. Once you purchase a course or combo bundle, you get lifetime access to the content on this platform.',
  },
  {
    q: 'Are the courses suitable for beginners?',
    a: 'Absolutely. We offer beginner to advanced levels with step-by-step lessons and practical projects.',
  },
  {
    q: 'Will I receive a certificate?',
    a: 'Yes. After completing your course requirements, you can download your certificate from the certificate section.',
  },
  {
    q: 'Can I learn on mobile?',
    a: 'Yes. Our platform works on mobile, tablet, and desktop. You can also download our app.',
  },
];

export function HomeFAQ() {
  return (
    <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto">
        <SectionTitle title="Frequently Asked Questions" subtitle="Quick answers before you enroll." />
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group dcc-card overflow-hidden hover:border-red-100/80 transition-colors duration-200"
            >
              <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-semibold text-slate-900 hover:bg-red-50/40 transition-colors list-none">
                {item.q}
                <span className="text-red-600 ml-3 shrink-0 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center group-open:rotate-45 transition-transform duration-300 text-lg leading-none">+</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-8">
          <PrimaryButton href="/faq" variant="ghost">
            View all FAQs
          </PrimaryButton>
        </div>
      </div>
    </AnimatedSection>
  );
}

export function HomeCTA() {
  return (
    <AnimatedSection className="py-16 md:py-20 px-4 sm:px-6 bg-white">
      <div className="max-w-5xl mx-auto relative overflow-hidden bg-gradient-to-br from-red-600 via-red-600 to-red-800 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl shadow-red-600/25 ring-1 ring-red-500/20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-900/40 rounded-full blur-2xl" />
        </div>
        <div className="relative">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 tracking-tight">
          Ready to start your digital career?
        </h2>
        <p className="text-red-100/90 max-w-xl mx-auto mb-8 leading-relaxed">
          Join thousands of learners building real skills with expert guidance and industry-recognized certification.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <PrimaryButton href="/courses" className="!bg-white !text-red-700 hover:!bg-red-50 !shadow-lg">
            Browse Courses
          </PrimaryButton>
          <PrimaryButton href="/contact" variant="secondary" className="!border-white/30 !text-white hover:!bg-white/10 !bg-white/5">
            Talk to us
          </PrimaryButton>
        </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
