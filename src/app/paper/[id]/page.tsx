import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import WorkspaceContainer from '@/components/workspace-container';

// Ensure the page is dynamically rendered if relying on real-time UUID lookups
export const dynamic = 'force-dynamic';

export default async function PaperPage({ params }: { params: { id: string } }) {
  // Initialize standard Supabase client for reading
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch the structurally enforced JSON payload from Postgres
  const { data: paper, error } = await supabase
    .from('papers')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !paper) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <WorkspaceContainer paper={paper} />
    </div>
  );
}
