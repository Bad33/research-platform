'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ArrowRight, BarChart3, MessageSquare } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PaperDetailView({ paper }: { paper: any }) {
  const formattedMarkdown = paper?.blog_body_markdown?.replace(/\\n/g, '\n') || '';

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 antialiased">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between text-sm">
          <a href="/" className="font-semibold tracking-tight text-zinc-900 hover:opacity-80 transition">
            Synthetica
          </a>
          <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 font-medium">
            {paper?.category || 'Research Brief'}
          </span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Main Editorial Content */}
          <article className="lg:col-span-7 space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-950 tracking-tight leading-tight">
                {paper?.blog_title}
              </h1>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
                <span>{paper?.author || 'Research Team'}</span>
                <span>•</span>
                <span>{paper?.read_time || '5 min read'}</span>
                {paper?.trending_score && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                      Impact Score: {paper.trending_score}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Executive Summary Brief */}
            <div className="rounded-xl border border-zinc-200/80 bg-gradient-to-b from-zinc-50/50 to-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Executive Summary</span>
              </div>
              <ul className="space-y-2.5">
                {paper?.tldr_bullets?.map((bullet: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 leading-normal">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-zinc max-w-none prose-headings:font-serif prose-headings:font-bold prose-headings:text-zinc-950 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-zinc-700 prose-p:leading-relaxed prose-p:text-base">
              <ReactMarkdown>{formattedMarkdown}</ReactMarkdown>
            </div>
          </article>

          {/* Sticky Sidebar: Visualization & Questions */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            
            {/* Chart Card */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Key Quantitative Finding</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mt-1">
                  {paper?.chart_data_json?.chart_title || 'Comparative Study Metrics'}
                </h3>
              </div>

              <div className="h-56 w-full text-xs">
                {paper?.chart_data_json?.data_points?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paper.chart_data_json.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="label" 
                        tickLine={false} 
                        axisLine={{ stroke: '#e2e8f0' }} 
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={{ stroke: '#e2e8f0' }} 
                        tick={{ fill: '#64748b', fontSize: 11 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#18181b', 
                          borderRadius: '8px', 
                          border: 'none', 
                          color: '#fff',
                          fontSize: '12px' 
                        }} 
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#2563eb" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400">
                    No chart data extracted for this record.
                  </div>
                )}
              </div>
            </div>

            {/* Interrogation Box */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Interrogate Findings</span>
              </div>
              <p className="text-xs text-zinc-600">
                Ask questions regarding methodology, cohort sizing, or statistical models.
              </p>
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="e.g., What was the control arm?"
                  className="w-full text-xs pl-3 pr-10 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white transition"
                />
                <button 
                  aria-label="Submit question"
                  className="absolute right-1.5 p-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
