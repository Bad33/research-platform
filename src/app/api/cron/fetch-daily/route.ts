import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Extends Vercel timeout to 60s for bulk LLM processing
export const maxDuration = 60; 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  if (searchParams.get('secret') !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
    model: 'gemini-3.6-flash',
    generationConfig: { responseMimeType: 'application/json', responseSchema, temperature: 0.3 }
  });

  // Reusable function that processes and inserts a single paper
  async function processAndInsertPaper(doi: string, rawTitle: string, rawAbstract: string, rawAuthor: string, category: string) {
    const { data: existing } = await supabase.from('papers').select('id').eq('doi', doi).single();
    if (existing) return { status: 'skipped', title: rawTitle };

    const prompt = `Convert this academic abstract into a reader-friendly blog post. Because we only have the abstract, extract or intelligently infer a realistic data table that represents the findings so we can chart it.\n\nAuthor: ${rawAuthor}\nTitle: ${rawTitle}\nAbstract: ${rawAbstract}`;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    const { error: insertError } = await supabase.from('papers').insert({
      doi,
      blog_title: parsedData.blog_title,
      excerpt: parsedData.excerpt,
      author: parsedData.author,
      category,
      read_time: '5 min read',
      tldr_bullets: parsedData.tldr_bullets,
      blog_body_markdown: parsedData.blog_body_markdown,
      chart_data_json: parsedData.chart_data_json
    });

    if (insertError) throw new Error(insertError.message);
    return { status: 'success', title: parsedData.blog_title };
  }

  try {
    // 1. FETCH BULK ARXIV
    const fetchAI = async () => {
      const arxivRes = await fetch('http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=5');
      const xmlText = await arxivRes.text();
      
      // Match all XML entry blocks instead of just the first one
      const entries = xmlText.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      if (entries.length === 0) throw new Error("Failed to parse ArXiv entries");

      // Loop over up to 5 entries and map them to Gemini requests
      const promises = entries.slice(0, 5).map(entry => {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const abstractMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const authorMatch = entry.match(/<name>([\s\S]*?)<\/name>/);
        
        const title = titleMatch ? titleMatch[1].replace(/<\/?title>/g, '').trim() : 'Unknown Title';
        const abstract = abstractMatch ? abstractMatch[1].replace(/<\/?summary>/g, '').trim() : 'No abstract provided.';
        const author = authorMatch ? authorMatch[1].replace(/<\/?name>/g, '').trim() : 'ArXiv Submitter';

        return processAndInsertPaper(title, title, abstract, author, 'Artificial Intelligence');
      });

      return Promise.allSettled(promises);
    };

    // 2. FETCH BULK EUROPE PMC
    const fetchMedical = async () => {
      const query = `("Blood" OR "JAMA" OR "Journal of Clinical Oncology" OR "ASH") AND (leukemia OR genomics OR oncology) AND OPEN_ACCESS:Y`;
      const encodedQuery = encodeURIComponent(query);
      
      // pageSize=5 pulls an array of 5 results
      const pmcRes = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodedQuery}&format=json&resultType=core&pageSize=5`);
      const pmcData = await pmcRes.json();
      
      const resultsArray = pmcData.resultList?.result || [];
      if (resultsArray.length === 0) throw new Error("No PMC results found");

      // Loop over up to 5 papers and map them to Gemini requests
      const promises = resultsArray.slice(0, 5).map((medPaper: any) => {
        const title = medPaper.title;
        const abstract = medPaper.abstractText || "No abstract provided.";
        const author = medPaper.authorString || "Various Authors";
        const doi = medPaper.doi || medPaper.id || title;

        return processAndInsertPaper(doi, title, abstract, author, 'Oncology & Genomics');
      });

      return Promise.allSettled(promises);
    };

    // Execute AI and Medical bulk tasks simultaneously 
    const [aiResults, medResults] = await Promise.allSettled([fetchAI(), fetchMedical()]);

    return NextResponse.json({
      message: 'Bulk fetch complete',
      ai_batch: aiResults.status === 'fulfilled' ? aiResults.value : aiResults.reason,
      medical_batch: medResults.status === 'fulfilled' ? medResults.value : medResults.reason
    });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
