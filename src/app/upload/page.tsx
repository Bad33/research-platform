'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, ArrowRight, Loader2, FileText } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [doi, setDoi] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText) return;
    
    setIsLoading(true);
    setError('');

    try {
      // If the user doesn't provide a DOI, we generate a timestamped ID for the database
      const documentId = doi.trim() || `doc-${Date.now()}`;

      const res = await fetch('/api/process-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi: documentId, sourceText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process paper');
      }

      // On success, redirect to the dynamic workspace page
      router.push(`/paper/${data.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-6 text-neutral-900 font-sans">
      <main className="w-full max-w-3xl bg-white border border-neutral-200 rounded-3xl shadow-sm p-8 md:p-12">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl mb-6">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Research Synthesizer
          </h1>
          <p className="text-neutral-500 text-lg max-w-lg">
            Paste any academic paper below. Our AI will extract the data, generate interactive charts, and write a scannable summary.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Document DOI / Title (Optional)
            </label>
            <input
              type="text"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              placeholder="e.g., 10.1038/s41586-023-06185-3"
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-neutral-700 mb-2">
              <FileText size={16} />
              Raw Paper Text (Required)
            </label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste the abstract, methodology, and data tables here..."
              className="w-full h-64 bg-neutral-50 border border-neutral-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !sourceText}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing Paper & Generating UI...
              </>
            ) : (
              <>
                Generate Dashboard
                <ArrowRight size={20} />
              </>
            )}
          </button>

        </form>
      </main>
    </div>
  );
}
