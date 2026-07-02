import PageHeader from './PageHeader';
import AnimatedSection from './AnimatedSection';

export default function StaticPageShell({ title, description, children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <PageHeader title={title} description={description} eyebrow="Digital Career Center" />
      <AnimatedSection className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="dcc-card p-6 sm:p-10 prose prose-slate max-w-none prose-headings:text-slate-900 prose-headings:tracking-tight prose-p:leading-relaxed prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline">
          {children}
        </div>
      </AnimatedSection>
    </div>
  );
}
