import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import PaperDetailView from './PaperDetailView';

export const dynamic = 'force-dynamic';

export default async function Page({ 
  params 
}: { 
  params: Promise<{ id: string }> | { id: string } 
}) {
  const resolvedParams = await params;
  const paperId = resolvedParams.id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Fetch the main paper
  const { data: paper, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', paperId)
    .single();

  if (error || !paper) {
    notFound();
  }

  // 2. Fetch semantic recommendations using the pgvector function
  let relatedPapers = [];
  if (paper.embedding) {
    const { data: related } = await supabase.rpc('match_papers', {
      query_embedding: paper.embedding,
      match_threshold: 0.5, // 50% similarity threshold
      match_count: 4      // Fetch 4 just in case one is the current paper
    });
    
    // Filter out the current paper from the results and keep the top 3
    relatedPapers = (related || [])
      .filter((rp: any) => rp.id !== paperId)
      .slice(0, 3);
  }

  return <PaperDetailView paper={paper} relatedPapers={relatedPapers} />;
}
