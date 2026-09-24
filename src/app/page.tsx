import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { ArrowRight, Sparkles, TrendingUp, Activity, Database, Telescope } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache the homepage for 1 hour

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch highest trending paper for the Hero section
  const { data: heroPaper } = await supabase
    .from('papers')
    .select('*')
    .order('trending_score', { ascending: false })
    .limit(1)
    .single();

  // Fetch papers grouped by your specific domains
  const fetchCategory = async (category: string) => {
    const { data } = await supabase
      .from('papers')
      .select('id, blog_title, category, trending_score, tldr_bullets')
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false })
      .limit(6);
    return data || [];
  };

  const [aiPapers, oncologyPapers, sportsPapers] = await Promise.all([
    fetchCategory('AI'),
    fetchCategory('Oncology'),
    fetchCategory('Sports')
  ]);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-serif font-bold tracking-tight text-zinc-900 hover:opacity-80 transition">
            Synthetica
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-600">
            <Link href="/" className="text-zinc-900">Library</Link>
            <Link href="/explore" className="hover:text-zinc-900 transition flex items-center gap-1.5">
              <Telescope className="w-4 h-4" /> Galaxy Map
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        
        {/* Featured Hero Article */}
        {heroPaper && (
          <section>
            <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-rose-600">
              <Sparkles className="w-4 h-4" />
              <span>Trending Analysis</span>
            </div>
            <Link href={`/paper/${heroPaper.id}`} className="group block">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-2xl border border-zinc-200/80 p-8 shadow-sm hover:shadow-md hover:border-zinc-300 transition duration-300">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-100 text-xs font-semibold text-zinc-700">
                    {heroPaper.category}
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-serif font-bold text-zinc-950 leading-tight group-hover:text-blue-600 transition">
                    {heroPaper.blog_title}
                  </h1>
                  <p className="text-zinc-600 text-lg leading-relaxed line-clamp-2">
                    {heroPaper.tldr_bullets?.[0] || "Deep dive into the methodology and clinical data implications of this latest study."}
                  </p>
                </div>
                <div className="lg:col-span-4 flex flex-col items-start lg:items-end space-y-4">
                  <div className="flex flex-col items-center justify-center w-24 h-24 rounded-full bg-emerald-50 border-4 border-emerald-100">
                    <span className="text-2xl font-bold text-emerald-700">{heroPaper.trending_score}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Impact</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
                    Read Report <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* AI & Foundation Models Row */}
        {aiPapers.length > 0 && (
          <CategoryRow 
            title="Generative AI & Infrastructure" 
            icon={<Database className="w-5 h-5 text-blue-600" />}
            papers={aiPapers} 
          />
        )}

        {/* Clinical Oncology ML Row */}
        {oncologyPapers.length > 0 && (
          <CategoryRow 
            title="Clinical Genomics & Oncology ML" 
            icon={<Activity className="w-5 h-5 text-rose-600" />}
            papers={oncologyPapers} 
          />
        )}

        {/* Quantitative Sports Analytics Row */}
        {sportsPapers.length > 0 && (
          <CategoryRow 
            title="Quantitative Sports Analytics" 
            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
            papers={sportsPapers} 
          />
        )}

      </main>
    </div>
  );
}

// Helper Component for Horizontal Scrolling Rows
function CategoryRow({ title, icon, papers }: { title: string, icon: React.ReactNode, papers: any[] }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-6">
        {icon}
        <h2 className="text-xl font-serif font-bold text-zinc-900">{title}</h2>
      </div>
      
      {/* CSS Hide Scrollbar but allow snapping */}
      <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory hide-scrollbar">
        {papers.map((paper) => (
          <Link 
            key={paper.id} 
            href={`/paper/${paper.id}`}
            className="group flex-shrink-0 w-80 sm:w-96 flex flex-col justify-between bg-white rounded-xl border border-zinc-200/80 p-6 snap-start shadow-sm hover:shadow-md hover:border-blue-200 transition duration-300"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-sm">
                  {paper.category}
                </span>
                {paper.trending_score > 85 && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-sm flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Hot
                  </span>
                )}
              </div>
              <h3 className="text-lg font-serif font-bold text-zinc-900 leading-snug group-hover:text-blue-600 transition line-clamp-3">
                {paper.blog_title}
              </h3>
              <p className="text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                {paper.tldr_bullets?.[0]}
              </p>
            </div>
            
            <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
              Read Analysis <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
