import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

// Allow Vercel up to 60 seconds to execute the bulk fetch and AI generation
export const maxDuration = 60; 

// Helper to fetch AI Research from ArXiv
async function fetchArxivPapers() {
  const response = await fetch('http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=5');
  const xml = await response.text();
  
  // Basic XML parsing for edge compatibility
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map(entry => {
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    
    const rawId = idMatch ? idMatch[1].trim() : `arxiv-${Date.now()}`;
    const doi = rawId.split('/abs/').pop() || rawId; 
    
    return {
      doi: `arxiv-${doi}`,
      category: 'Artificial Intelligence',
      sourceText: `Title: ${titleMatch ? titleMatch[1].trim() : ''}\nAbstract: ${summaryMatch ? summaryMatch[1].trim() : ''}`
    };
  });
}

// Helper to fetch Clinical Research from Europe PMC
async function fetchMedicalPapers() {
  // Upgraded query to include JEV and exosomes
  const query = encodeURIComponent(`("Blood" OR "JAMA" OR "Journal of Clinical Oncology" OR "ASH" OR "Journal of Extracellular Vesicles") AND (leukemia OR genomics OR oncology OR exosomes) AND OPEN_ACCESS:Y`);
  const response = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&format=json&resultType=core`);
  const data = await response.json();
  
  const results = data.resultList?.result || [];
  return results.slice(0, 5).map((item: any) => ({
    doi: item.doi || `pmc-${item.pmcid}`,
    category: 'Oncology & Genomics',
    sourceText: `Title: ${item.title}\nAbstract: ${item.abstractText || 'No abstract available.'}`
  }));
}

// Vercel Cron natively uses GET requests
export async function GET(req: Request) {
  // 1. Security Check: Authenticate the Vercel Cron trigger
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  
  // 2. Define the Expanded Schema
  const responseSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
      blog_title: { type: SchemaType.STRING },
      tldr_bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      blog_body_markdown: { type: SchemaType.STRING },
      limitations_and_biases: { type: SchemaType.STRING, description: "A critical analysis of the study's flaws, small sample sizes, or methodological biases." },
      github_repo_link: { type: SchemaType.STRING, description: "Extract the GitHub repository URL if mentioned, otherwise return null.", nullable: true },
      trending_score: { type: SchemaType.INTEGER },
      chart_data_json: {
        type: SchemaType.OBJECT,
        properties: {
          chart_type: { type: SchemaType.STRING, description: "Must be one of: 'bar', 'line', 'pie', or 'scatter' based on what fits the data best." },
          chart_title: { type: SchemaType.STRING },
          x_axis_label: { type: SchemaType.STRING },
          y_axis_label: { type: SchemaType.STRING },
          data_points: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                value: { type: SchemaType.NUMBER }
              },
              required: ["label", "value"]
            }
          }
        },
        required: ["chart_type", "chart_title", "x_axis_label", "y_axis_label", "data_points"]
      }
    },
    required: ["blog_title", "tldr_bullets", "blog_body_markdown", "limitations_and_biases", "trending_score", "chart_data_json"]
  };

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.8-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: responseSchema,
      temperature: 0.2,
    }
  });

  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  try {
    // 3. Fetch all raw papers concurrently
    const [arxivPapers, medicalPapers] = await Promise.all([
      fetchArxivPapers(),
      fetchMedicalPapers()
    ]);
    const allPapers = [...arxivPapers, ...medicalPapers];

    // 4. Process papers through Gemini concurrently (10 requests at once)
    const results = await Promise.allSettled(allPapers.map(async (paper) => {
      // Check if paper already exists to save API calls & avoid duplicates
      const { data: existing } = await supabase.from('papers').select('id').eq('doi', paper.doi).single();
      if (existing) return { status: 'skipped', doi: paper.doi };

      // Generate AI Extraction & Summary
      const prompt = `You are an expert researcher explaining a complex paper to a peer. 
      Do NOT write a generic, fluffy blog post. Write a highly structured, pedagogical deep-dive in Markdown that allows the reader to fully understand the mechanics of the study without reading the original paper.
      
      Structure the 'blog_body_markdown' exactly like this:
      ### The Core Problem
      [Explain precisely why this research is necessary and what gap in the current landscape it fills]
      
      ### Methodology & Architecture
      [Explain exactly how they built the model, designed the clinical trial, or structured the data. Be technical and specific.]
      
      ### Key Findings & Metrics
      [Detail the specific outcomes, benchmark scores, or survival rates discovered.]
      
      Extract or intelligently infer a realistic data table representing the key findings so we can chart it.
      Assign a 'trending_score' (1-100) based on venue prestige and breakthrough factor.
      
      Document Identifier: ${paper.doi}
      Source Content:
      ${paper.sourceText}`;

      const aiResult = await model.generateContent(prompt);
      const parsedData = JSON.parse(aiResult.response.text());

      // Generate Vector Embedding for Recommendations
      const embedResult = await embeddingModel.embedContent(parsedData.blog_body_markdown);
      const vectorValues = embedResult.embedding.values;

      // Insert all fields into Supabase
      const { error: insertError } = await supabase.from('papers').insert({
        doi: paper.doi,
        category: paper.category, // Distinguishes between AI and Oncology feeds
        blog_title: parsedData.blog_title,
        tldr_bullets: parsedData.tldr_bullets,
        blog_body_markdown: parsedData.blog_body_markdown,
        limitations_and_biases: parsedData.limitations_and_biases,
        github_repo_link: parsedData.github_repo_link,
        trending_score: parsedData.trending_score,
        chart_data_json: parsedData.chart_data_json,
        embedding: vectorValues 
      });

      if (insertError) throw new Error(insertError.message);
      return { status: 'success', doi: paper.doi };
    }));

    return NextResponse.json({ message: "Bulk fetch and vector generation complete", results });

  } catch (error: any) {
    console.error('Cron Pipeline Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
