import PageHeader from './PageHeader';
import AnimatedSection from './AnimatedSection';

export default function StaticPageShell({ title, description, children, wide = false }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PageHeader title={title} description={description} eyebrow="Digital Career Center" />
      <AnimatedSection
        className={`mx-auto w-full px-4 sm:px-5 lg:px-6 py-10 md:py-14 ${
          wide ? 'max-w-7xl' : 'max-w-3xl lg:max-w-4xl'
        }`}
      >
        {wide ? (
          children
        ) : (
          <div className="dcc-card p-6 sm:p-10 prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        )}
      </AnimatedSection>
    </div>
  );
}
