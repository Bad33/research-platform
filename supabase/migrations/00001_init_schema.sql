-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the papers cache table
CREATE TABLE public.papers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doi TEXT UNIQUE NOT NULL,
    blog_title TEXT NOT NULL,
    tldr_bullets TEXT[] NOT NULL,
    blog_body_markdown TEXT NOT NULL,
    chart_data_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for ultra-fast cache lookups
CREATE INDEX idx_papers_doi ON public.papers(doi);

-- Enable Row Level Security (RLS)
ALTER TABLE public.papers ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Modify based on auth requirements)
CREATE POLICY "Allow public read access to papers"
ON public.papers FOR SELECT USING (true);

-- Allow service role to insert (Next.js API route)
CREATE POLICY "Allow service role insert"
ON public.papers FOR INSERT WITH CHECK (true);
