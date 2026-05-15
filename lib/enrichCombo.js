/**
 * Merge combo document + populated courses for storefront display.
 */
export function enrichCombo(combo) {
  if (!combo) return null;
  const courses = Array.isArray(combo.courseIds) ? combo.courseIds : [];
  const sumList = courses.reduce((s, c) => s + (Number(c?.price) || 0), 0);
  const perks = [...new Set(courses.flatMap((c) => c?.perks || []).filter(Boolean))];
  const features = [
    ...new Set([
      'Lifetime Access',
      ...courses.flatMap((c) => c?.features || []).filter(Boolean),
    ]),
  ].slice(0, 6);
  const categories = [...new Set(courses.map((c) => c?.category).filter(Boolean))];

  return {
    ...combo,
    courseCount: courses.length,
    originalPrice:
      Number(combo.originalPrice) > 0 ? Number(combo.originalPrice) : sumList,
    thumbnail: combo.thumbnail || courses[0]?.thumbnail || '',
    shortDescription:
      combo.shortDescription ||
      `Bundle of ${courses.length} courses: ${courses.map((c) => c?.title).filter(Boolean).join(', ')}`,
    banner: combo.banner || 'Combo bundle — save when you buy together',
    viewMore: combo.viewMore || combo.description || '',
    perks: perks.length ? perks : ['Lifetime Access', 'All included courses'],
    features,
    category: categories[0] || 'Bundle',
    level: courses[0]?.level || 'Beginner',
    duration: 'Lifetime Access',
    instructor: courses[0]?.instructor || { name: 'Digital Career Center' },
    isFeatured: true,
    isCombo: true,
  };
}
