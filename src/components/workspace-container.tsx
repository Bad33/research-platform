'use client';

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Label } from 'recharts';
import { BookOpen, Sparkles, Send, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; // Ensure react-markdown is installed

interface ChartData {
  chart_title: string;
  x_axis_label: string;
  y_axis_label: string;
  data_points: { label: string; value: number }[];
}

interface PaperProps {
  paper: {
    blog_title: string;
    tldr_bullets: string[];
    blog_body_markdown: string;
    chart_data_json: ChartData;
  };
}

export default function WorkspaceContainer({ paper }: PaperProps) {
  const [chatQuery, setChatQuery] = useState('');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      
      {/* LEFT COLUMN: Narrative Reading Space (55%) */}
      <main className="w-full lg:w-[55%] p-8 lg:p-16 overflow-y-auto border-r border-neutral-200 bg-white">
        <article className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide uppercase mb-6">
              <BookOpen size={14} /> AI Summarized
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-950 mb-6 leading-tight">
              {paper.blog_title}
            </h1>
            
            {/* 3-Bullet TLDR Card */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 shadow-sm">
              <h3 className="flex items-center gap-2 font-bold text-neutral-800 mb-4">
                <Sparkles size={18} className="text-amber-500" /> Key Takeaways
              </h3>
              <ul className="space-y-3">
                {paper.tldr_bullets.map((bullet, idx) => (
                  <li key={idx} className="flex gap-3 text-neutral-700 leading-relaxed">
                    <span className="text-blue-500 font-bold">•</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Markdown Content rendered via Tailwind Prose */}
          <div className="prose prose-neutral prose-lg max-w-none prose-headings:font-bold prose-h2:text-2xl prose-a:text-blue-600">
            <ReactMarkdown>{paper.blog_body_markdown}</ReactMarkdown>
          </div>
        </article>
      </main>

      {/* RIGHT COLUMN: Interactive Dashboard (45%) */}
      <aside className="w-full lg:w-[45%] bg-neutral-50 p-6 lg:p-8 relative">
        <div className="sticky top-8 flex flex-col gap-6 h-[calc(100vh-4rem)]">
          
          {/* Data Visualization Window */}
          <div className="flex-1 bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 flex flex-col">
            <div className="mb-6 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {paper.chart_data_json.chart_title}
                </h3>
                <p className="text-sm text-neutral-500 flex items-center gap-1 mt-1">
                  <Activity size={14} /> Extracted from source data
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paper.chart_data_json.data_points} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis 
                    dataKey="label" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 12 }}
                    dy={10}
                  >
                    <Label value={paper.chart_data_json.x_axis_label} offset={-20} position="insideBottom" style={{ fill: '#404040', fontSize: 13, fontWeight: 500 }} />
                  </XAxis>
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#737373', fontSize: 12 }}
                  >
                    <Label value={paper.chart_data_json.y_axis_label} angle={-90} position="insideLeft" style={{ fill: '#404040', fontSize: 13, fontWeight: 500 }} />
                  </YAxis>
                  <Tooltip 
                    cursor={{ fill: '#f5f5f5' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Data Query Input Module */}
          <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm p-4">
            <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 block">
              Inquire about this data
            </label>
            <form 
              onSubmit={(e) => { e.preventDefault(); /* Hook into gemini-2.5-flash here */ }}
              className="flex items-center gap-2 relative"
            >
              <input
                type="text"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                placeholder="E.g., What causes the spike in the third quadrant?"
                className="w-full bg-neutral-50 border border-neutral-200 text-neutral-900 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button 
                type="submit" 
                className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>

        </div>
      </aside>
    </div>
  );
}
