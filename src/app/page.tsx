import Link from 'next/link';
import { Sparkles, Microscope, Clock, ChevronRight, UploadCloud, TrendingUp } from 'lucide-react';

// --- MOCK DATA ---
// In a production app, these would be fetched from your Supabase database.
const featuredPapers = [
  {
    id: 'demo-ai-1',
    title: 'Attention Is All You Need: A Retrospective on Transformers',
    category: 'Generative AI',
    date: 'Sep 21, 2026',
    readTime: '8 min read',
    gradient: 'from-blue-600 to-indigo-900',
  },
  {
    id: 'demo-bio-1',
    title: 'CRISPR-Cas9 Mediated Gene Editing in Solid Tumors: Clinical Efficacy',
    category: 'Oncology',
    date: 'Sep 19, 2026',
    readTime: '12 min read',
    gradient: 'from-emerald-600 to-teal-900',
  },
  {
    id: 'demo-ai-2',
    title: 'Scaling Laws for Neural Language Models in 2026',
    category: 'Machine Learning',
    date: 'Sep 15, 2026',
    readTime: '10 min read',
    gradient: 'from-violet-600 to-purple-900',
  }
];

const aiFeed = [
  {
    id: 'demo-ai-3',
    title: 'Sparse Mixture-of-Experts: Optimizing Compute in LLMs',
    excerpt: 'An analysis of how dynamic routing algorithms in neural networks are drastically reducing inference costs without sacrificing reasoning capabilities.',
    author: 'Dr. Elena Rostova',
    date: 'Sep 20',
    readTime: '6 min read'
  },
  {
    id: 'demo-ai-4',
    title: 'Multimodal AI in Medical Diagnostics: Beyond Image Recognition',
    excerpt: 'Combining patient electronic health records (EHR) with radiological imaging to predict patient outcomes using unified transformer architectures.',
    author: 'James Chen, et al.',
    date: 'Sep 18',
    readTime: '9 min read'
  }
];

const cancerFeed = [
  {
    id: 'demo-bio-2',
    title: 'CAR-T Cell Therapy Efficacy in Non-Small Cell Lung Cancer',
    excerpt: 'Recent clinical trials demonstrate unprecedented long-term remission rates when combining CAR-T therapies with targeted PD-1 inhibitors.',
    author: 'Dr. Sarah Jenkins',
    date: 'Sep 22',
    readTime: '14 min read'
  },
  {
    id: 'demo-bio-3',
    title: 'Liquid Biopsies: Early Detection of Pancreatic Ductal Adenocarcinoma',
    excerpt: 'Measuring circulating tumor DNA (ctDNA) methylation patterns to identify early-stage pancreatic cancer years before symptomatic presentation.',
    author: 'Michael Torres, PhD',
    date: 'Sep 16',
    readTime: '11 min read'
  }
];

export default function DiscoveryFeed() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-neutral-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Top Navigation */}
      <nav className="border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="bg-neutral-900 text-white p-1.5 rounded-lg">
              <Microscope size={18} />
            </span>
            Synthetica
          </div>
          <Link 
            href="/upload" 
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-2 transition-colors"
          >
            <UploadCloud size={16} />
            Analyze a Paper
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* CAROUSEL SECTION: Trending Research */}
        <section className="mb-20">
          <div className="flex items-center gap-2 mb-8">
            <TrendingUp size={24} className="text-blue-600" />
            <h2 className="text-2xl font-bold tracking-tight">Trending This Week</h2>
          </div>
          
          {/* Horizontal Scroll Container */}
          <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
            {featuredPapers.map((paper) => (
              <Link 
                href={`/paper/${paper.id}`} 
                key={paper.id}
                className={`min-w-[85vw] md:min-w-[400px] lg:min-w-[500px] h-[320px] rounded-3xl p-8 flex flex-col justify-between text-white snap-center hover:scale-[1.02] transition-transform duration-300 bg-gradient-to-br ${paper.gradient} shadow-lg`}
              >
                <div>
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                    {paper.category}
                  </span>
                  <h3 className="text-3xl font-serif font-bold leading-tight line-clamp-3">
                    {paper.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between mt-6 text-white/80 text-sm font-medium">
                  <span className="flex items-center gap-1.5"><Clock size={16} /> {paper.readTime}</span>
                  <span>{paper.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FEED SECTION: Grid Layout for Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Column 1: AI & Machine Learning */}
          <section>
            <div className="flex items-center gap-2 mb-8 border-b border-neutral-200 pb-4">
              <Sparkles size={24} className="text-violet-600" />
              <h2 className="text-2xl font-bold tracking-tight">Artificial Intelligence</h2>
            </div>
            <div className="flex flex-col gap-10">
              {aiFeed.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>

          {/* Column 2: Cancer Research */}
          <section>
            <div className="flex items-center gap-2 mb-8 border-b border-neutral-200 pb-4">
              <Microscope size={24} className="text-emerald-600" />
              <h2 className="text-2xl font-bold tracking-tight">Oncology & Genomics</h2>
            </div>
            <div className="flex flex-col gap-10">
              {cancerFeed.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// Reusable component for the Medium-style list items
function ArticleCard({ article }: { article: any }) {
  return (
    <Link href={`/paper/${article.id}`} className="group block">
      <article className="flex flex-col gap-3">
        {/* Title uses font-serif for editorial feel */}
        <h3 className="text-2xl font-serif font-bold text-neutral-900 leading-snug group-hover:text-blue-600 transition-colors">
          {article.title}
        </h3>
        {/* Excerpt with high line-height for readability */}
        <p className="text-neutral-600 text-base leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
        {/* Metadata row */}
        <div className="flex items-center gap-4 text-sm font-medium text-neutral-500 mt-2">
          <span className="text-neutral-900">{article.author}</span>
          <span>·</span>
          <span>{article.date}</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock size={14} /> {article.readTime}</span>
        </div>
      </article>
    </Link>
  );
}
