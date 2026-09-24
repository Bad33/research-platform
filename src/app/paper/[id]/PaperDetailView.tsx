'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Sparkles, ArrowRight, BarChart3, MessageSquare, Code, AlertTriangle, User, Bot, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PaperDetailView({ paper, relatedPapers = [] }: { paper: any, relatedPapers?: any[] }) {

  // Chat State
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([]);

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          paperContent: formattedMarkdown,
          chatHistory: messages
        })
      });

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'model', content: data.reply }]);
      } else {
        throw new Error(data.error || 'Failed to fetch response');
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error analyzing the paper.' }]);
    } finally {
      setIsLoading(false);
    }
  };

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
            {/* Netflix-Style Semantic Recommendations */}
            {relatedPapers?.length > 0 && (
              <div className="mt-16 pt-8 border-t border-zinc-200/80">
                <div className="flex items-center gap-2 mb-6 text-xs font-semibold uppercase tracking-wider text-zinc-800">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Related Research</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {relatedPapers.map((rp: any) => (
                    <a 
                      key={rp.id} 
                      href={`/paper/${rp.id}`} 
                      className="group block p-5 rounded-xl border border-zinc-200/80 bg-white hover:border-blue-400 hover:shadow-md transition duration-200"
                    >
                      <h4 className="text-sm font-serif font-bold text-zinc-900 line-clamp-2 group-hover:text-blue-600 transition">
                        {rp.blog_title}
                      </h4>
                      <div className="mt-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
                        Read Analysis <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>

          

          {/* Sticky Sidebar: Visualization & Questions */}
          <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
            
            {/* Dynamic Chart Card */}
            <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Quantitative Analysis</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-900 mt-1">
                  {paper?.chart_data_json?.chart_title || 'Extracted Metrics'}
                </h3>
              </div>

              <div className="h-56 w-full text-xs">
                {paper?.chart_data_json?.data_points?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {paper.chart_data_json.chart_type === 'line' ? (
                      <LineChart data={paper.chart_data_json.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} />
                      </LineChart>
                    ) : paper.chart_data_json.chart_type === 'pie' ? (
                      <PieChart>
                        <Pie data={paper.chart_data_json.data_points} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                          {paper.chart_data_json.data_points.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                      </PieChart>
                    ) : (
                      <BarChart data={paper.chart_data_json.data_points} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                        <YAxis tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fill: '#64748b' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', color: '#fff', border: 'none' }} />
                        <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-400">No chart data extracted.</div>
                )}
              </div>
            </div>

            {/* Methodological Rigor & GitHub Section */}
            {(paper?.limitations_and_biases || paper?.github_repo_link) && (
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm space-y-4">
                {paper?.limitations_and_biases && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-rose-700 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Study Limitations</span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {paper.limitations_and_biases}
                    </p>
                  </div>
                )}
                {paper?.github_repo_link && (
                  <div className="pt-3 border-t border-rose-100">
                      <a href={paper.github_repo_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-medium text-zinc-900 hover:text-blue-600 transition">
                        <Code className="w-4 h-4" />
                        View Official Code Repository
                      </a>
                  </div>
                )}
              </div>
            )}

            {/* LIVE CHAT INTERROGATION BOX */}
            <div className="rounded-xl border border-zinc-200/80 bg-white shadow-sm flex flex-col h-96">
              <div className="p-4 border-b border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Interrogate Findings</span>
                </div>
              </div>

              {/* Chat Message Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm bg-zinc-50/30">
                {messages.length === 0 ? (
                  <p className="text-zinc-500 text-xs mt-2 text-center">
                    Ask questions regarding methodology, cohort sizing, or statistical models. The AI will read the paper to answer.
                  </p>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'model' && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`p-3 rounded-lg max-w-[85%] ${msg.role === 'user' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-800 shadow-sm'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                     <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                     <div className="p-3 flex items-center text-zinc-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                     </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-zinc-100 bg-white rounded-b-xl">
                <form onSubmit={handleAskQuestion} className="relative flex items-center">
                  <input 
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={isLoading}
                    placeholder="e.g., What was the control arm?"
                    className="w-full text-xs pl-3 pr-10 py-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 focus:bg-white transition disabled:opacity-50"
                  />
                  <button 
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className="absolute right-1.5 p-1.5 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 transition disabled:opacity-50"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </form>
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
