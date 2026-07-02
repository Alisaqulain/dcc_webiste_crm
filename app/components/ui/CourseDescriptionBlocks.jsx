import { formatCourseDescription } from '@/lib/formatCourseDescription';

export default function CourseDescriptionBlocks({ description }) {
  if (!description) return null;

  const blocks = formatCourseDescription(description);

  return (
    <div className="dcc-prose-description space-y-5 max-w-4xl">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50/90 to-white p-5 sm:p-7 shadow-sm"
        >
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="w-1 h-6 bg-gradient-to-b from-red-500 to-red-700 rounded-full shrink-0" />
            {block.title}
          </h3>
          {block.paragraphs?.length > 0 && (
            <div className="space-y-3 mb-4 pl-4 border-l-2 border-slate-100">
              {block.paragraphs.map((p, j) => (
                <p key={j} className="text-sm sm:text-[0.9375rem] text-slate-600 leading-[1.75]">
                  {p}
                </p>
              ))}
            </div>
          )}
          {block.items?.length > 0 && (
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className="flex items-start gap-2.5 text-sm text-slate-700 bg-white rounded-xl px-3.5 py-2.5 border border-slate-100 shadow-sm hover:border-red-100 hover:shadow transition-all duration-200"
                >
                  <span className="text-red-600 mt-0.5 shrink-0 font-bold">✓</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
