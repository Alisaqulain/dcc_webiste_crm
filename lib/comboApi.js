import { enrichCombo } from '@/lib/enrichCombo';
import { resolvePublicUrl } from '@/lib/resolvePublicUrl';

/** How many course refs a combo must have to appear on the storefront */
export function comboHasMinCourses(doc, min = 2) {
  const ids = doc?.courseIds;
  if (!Array.isArray(ids)) return false;
  return ids.filter(Boolean).length >= min;
}

export function mapPublicCombos(rawList, request) {
  return (rawList || [])
    .filter((doc) => comboHasMinCourses(doc, 2))
    .map((doc) => {
      const validCourses = (doc.courseIds || []).filter((c) => c && c._id);
      const enriched = enrichCombo({ ...doc, courseIds: validCourses });
      if (!enriched) return null;
      enriched.thumbnail = resolvePublicUrl(enriched.thumbnail, request);
      enriched.courseIds = validCourses.map((c) => ({
        ...c,
        thumbnail: resolvePublicUrl(c.thumbnail, request),
      }));
      return enriched;
    })
    .filter(Boolean);
}

export const COMBO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
};
