import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Sparkles, Microscope, Clock, UploadCloud, TrendingUp } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DiscoveryFeed() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch top 10 overall for the Trending Carousel
  const { data: trendingFeed } = await supabase
    .from('papers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch specific categories for the grid feeds
  const { data: aiFeed } = await supabase
    .from('papers')
    .select('*')
    .eq('category', 'Artificial Intelligence')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: cancerFeed } = await supabase
    .from('papers')
    .select('*')
    .eq('category', 'Oncology & Genomics')
    .order('created_at', { ascending: false })
    .limit(5);

  const isDbEmpty = !trendingFeed?.length;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-neutral-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <span className="bg-neutral-900 text-white p-1 rounded-md">
              <Microscope size={16} />
            </span>
            Synthetica
          </div>
          <Link 
            href="/upload" 
            className="text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 transition-colors"
          >
            <UploadCloud size={14} />
            Analyze Paper
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {isDbEmpty ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">No Research Found</h2>
            <p className="text-sm text-neutral-500 mb-6">Your database is currently empty.</p>
            <Link href="/upload" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <UploadCloud size={16} /> Manually Upload
            </Link>
          </div>
        ) : (
          <>
            {/* CAROUSEL SECTION: Top 10 Research */}
            <section className="mb-16">
              <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                <TrendingUp size={18} className="text-blue-600" />
                <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-800">Top Research</h2>
              </div>
              
              {/* Horizontal Scroll Container (Hides native scrollbar) */}
              <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {trendingFeed?.map((paper, idx) => {
                  // Alternate dark background gradients for carousel cards
                  const gradients = [
                    'from-slate-800 to-neutral-900',
                    'from-blue-900 to-slate-800',
                    'from-zinc-800 to-stone-900'
                  ];
                  const bg = gradients[idx % gradients.length];
                  
                  return (
                    <Link 
                      href={`/paper/${paper.id}`} 
                      key={paper.id}
                      className={`min-w-[85vw] md:min-w-[320px] lg:min-w-[360px] h-[200px] rounded-2xl p-6 flex flex-col justify-between text-white snap-center hover:-translate-y-1 transition-transform duration-300 bg-gradient-to-br ${bg} shadow-sm border border-neutral-800`}
                    >
                      <div>
                        <span className="inline-block px-2 py-1 bg-white/10 backdrop-blur-md rounded text-[10px] font-semibold uppercase tracking-wider mb-3">
                          {paper.category}
                        </span>
                        <h3 className="text-lg font-serif font-medium leading-snug line-clamp-3">
                          {paper.blog_title}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between text-white/60 text-xs font-medium">
                        <span className="truncate pr-4">{paper.author || 'AI Extracted'}</span>
                        <span className="flex items-center gap-1 shrink-0"><Clock size={12} /> {paper.read_time || '5 min'}</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* FEED SECTION: Grid Layout for Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              
              {/* Column 1: AI */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                  <Sparkles size={18} className="text-violet-600" />
                  <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-800">Artificial Intelligence</h2>
                </div>
                <div className="flex flex-col gap-8">
                  {aiFeed?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>

              {/* Column 2: Oncology */}
              <section>
                <div className="flex items-center gap-2 mb-6 border-b border-neutral-200 pb-3">
                  <Microscope size={18} className="text-emerald-600" />
                  <h2 className="text-sm font-bold tracking-widest uppercase text-neutral-800">Oncology & Genomics</h2>
                </div>
                <div className="flex flex-col gap-8">
                  {cancerFeed?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </section>

            </div>
          </>
        )}
      </main>
    </div>
  );
}

// Sub-component for clean, compact list items
function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/paper/${article.id}`} className="group block">
      <article className="flex flex-col gap-2">
        <h3 className="text-xl font-serif font-semibold text-neutral-900 leading-snug group-hover:text-blue-600 transition-colors">
          {article.blog_title}
        </h3>
        <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
          {article.excerpt || article.tldr_bullets?.[0] || 'Read the full analysis inside...'}
        </p>
        <div className="flex items-center gap-3 text-xs font-medium text-neutral-400 mt-1">
          <span className="text-neutral-700">{article.author || 'AI Extracted'}</span>
          <span>·</span>
          <span>{new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </article>
    </Link>
  );
}
