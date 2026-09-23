import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Microscope, Clock, UploadCloud, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DiscoveryFeed() {
  // Initialize Supabase Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch papers by category
  const { data: aiFeed } = await supabase
    .from('papers')
    .select('*')
    .eq('category', 'Artificial Intelligence')
    .order('created_at', { ascending: false })
    .limit(4);

  const { data: cancerFeed } = await supabase
    .from('papers')
    .select('*')
    .eq('category', 'Oncology & Genomics')
    .order('created_at', { ascending: false })
    .limit(4);

  // Fallback UI if database is empty
  const isDbEmpty = !aiFeed?.length && !cancerFeed?.length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans">
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="bg-neutral-900 text-white p-1.5 rounded-lg"><Microscope size={18} /></span>
            Synthetica
          </div>
          <Link href="/upload" className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2">
            <UploadCloud size={16} /> Analyze a Paper
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {isDbEmpty ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-neutral-800 mb-4">No Research Found</h2>
            <p className="text-neutral-500 mb-8">Your database is currently empty. Set up the cron job or upload a paper manually.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700">
              <UploadCloud size={18} /> Manually Upload Paper
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <section>
              <div className="flex items-center gap-2 mb-8 border-b border-neutral-200 pb-4">
                <Sparkles size={24} className="text-violet-600" />
                <h2 className="text-2xl font-bold tracking-tight">Artificial Intelligence</h2>
              </div>
              <div className="flex flex-col gap-10">
                {aiFeed?.map((article) => <ArticleCard key={article.id} article={article} />)}
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-8 border-b border-neutral-200 pb-4">
                <Microscope size={24} className="text-emerald-600" />
                <h2 className="text-2xl font-bold tracking-tight">Oncology & Genomics</h2>
              </div>
              <div className="flex flex-col gap-10">
                {cancerFeed?.map((article) => <ArticleCard key={article.id} article={article} />)}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/paper/${article.id}`} className="group block">
      <article className="flex flex-col gap-3">
        <h3 className="text-2xl font-serif font-bold text-neutral-900 leading-snug group-hover:text-blue-600 transition-colors">
          {article.blog_title}
        </h3>
        <p className="text-neutral-600 text-base leading-relaxed line-clamp-2">
          {article.excerpt || article.tldr_bullets?.[0] || 'Read the full analysis inside...'}
        </p>
        <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mt-2">
          <span className="text-neutral-900">{article.author || 'AI Extracted'}</span>
          <span>·</span>
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        </div>
      </article>
    </Link>
  );
}
