import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Optional: Protect this route using a secret key query param so it can't be spammed
// Example usage: /api/cron/fetch-arxiv?secret=MY_CRON_SECRET

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Basic security check (set this in your environment variables later)
  if (searchParams.get('secret') !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    // 1. Fetch latest AI paper metadata from ArXiv
    const arxivRes = await fetch('http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=desc&max_results=1');
    const xmlText = await arxivRes.text();
    
    // Quick regex to extract title and abstract (in production, use an XML parser)
    const titleMatch = xmlText.match(/<title>([\s\S]*?)<\/title>/g);
    const abstractMatch = xmlText.match(/<summary>([\s\S]*?)<\/summary>/g);
    const authorMatch = xmlText.match(/<name>([\s\S]*?)<\/name>/);
    
    if (!titleMatch || !abstractMatch) throw new Error("Failed to parse ArXiv");

    // We take the second title match because the first is the feed title itself
    const rawTitle = titleMatch[1].replace(/<\/?title>/g, '').trim();
    const rawAbstract = abstractMatch[0].replace(/<\/?summary>/g, '').trim();
    const rawAuthor = authorMatch ? authorMatch[1] : 'ArXiv Submission';

    // 2. Check if we already processed this paper (using title as proxy for DOI)
    const { data: existing } = await supabase.from('papers').select('id').eq('doi', rawTitle).single();
    if (existing) {
      return NextResponse.json({ message: 'Paper already ingested', title: rawTitle });
    }

    // 3. Define the updated schema for the new database structure
    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        blog_title: { type: SchemaType.STRING },
        excerpt: { type: SchemaType.STRING },
        author: { type: SchemaType.STRING },
        tldr_bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        blog_body_markdown: { type: SchemaType.STRING },
        chart_data_json: {
          type: SchemaType.OBJECT,
          properties: {
            chart_title: { type: SchemaType.STRING },
            x_axis_label: { type: SchemaType.STRING },
            y_axis_label: { type: SchemaType.STRING },
            data_points: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.OBJECT, properties: { label: { type: SchemaType.STRING }, value: { type: SchemaType.NUMBER } }, required: ["label", "value"] }
            }
          },
          required: ["chart_title", "x_axis_label", "y_axis_label", "data_points"]
        }
      },
      required: ["blog_title", "excerpt", "author", "tldr_bullets", "blog_body_markdown", "chart_data_json"]
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.3 }
    });

    // Ask Gemini to synthesize the abstract and invent a plausible data structure for visualization
    const prompt = `Convert this academic abstract into a reader-friendly blog post. Because we only have the abstract, extract or intelligently infer a realistic data table that represents the findings so we can chart it.\n\nAuthor: ${rawAuthor}\nTitle: ${rawTitle}\nAbstract: ${rawAbstract}`;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    // 4. Save to Database
    const { data: newPaper, error: insertError } = await supabase
      .from('papers')
      .insert({
        doi: rawTitle, // Using title as unique identifier here
        blog_title: parsedData.blog_title,
        excerpt: parsedData.excerpt,
        author: parsedData.author,
        category: 'Artificial Intelligence',
        read_time: '5 min read',
        tldr_bullets: parsedData.tldr_bullets,
        blog_body_markdown: parsedData.blog_body_markdown,
        chart_data_json: parsedData.chart_data_json
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ message: 'Successfully ingested new ArXiv paper', data: newPaper });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
