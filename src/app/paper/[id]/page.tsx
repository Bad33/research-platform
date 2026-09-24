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

  const { data: paper, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', paperId)
    .single();

  if (error || !paper) {
    notFound();
  }

  return <PaperDetailView paper={paper} />;
}
