import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import WorkspaceContainer from '@/components/workspace-container';

export const dynamic = 'force-dynamic';

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  // 1. Await the params promise first
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 2. Use the awaited ID in the query
  const { data: paper, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !paper) {
    notFound();
  }

  // Pass the data to your dynamic reading workspace UI
  return <WorkspaceContainer paper={paper} />;
}
