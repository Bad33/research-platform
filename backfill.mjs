// backfill.mjs
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'fs';

// Load local environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Ensure keys are present before starting
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.GEMINI_API_KEY) {
  console.error("Error: Local environment variables not configured. Check .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the Production-Ready Schema (limitations, charts, vectors, etc.)
const responseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    blog_title: { type: SchemaType.STRING },
    tldr_bullets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    blog_body_markdown: { type: SchemaType.STRING },
    limitations_and_biases: { type: SchemaType.STRING },
    github_repo_link: { type: SchemaType.STRING, nullable: true },
    trending_score: { type: SchemaType.INTEGER },
    chart_data_json: {
      type: SchemaType.OBJECT,
      properties: {
        chart_type: { type: SchemaType.STRING },
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

// Sleep helper (Gemini free tier allows 15 requests/min)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: responseSchema,
    temperature: 0.2,
  }
});

const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Domain 1: AI/LLM Fetch (ArXiv refined to prestige)
async function fetchPrestigeAiPapers(maxResults = 100) {
  const queryParts = [
    '(all:"foundation+models" OR all:"multi-modal+foundation+models")',
    '(all:"reinforcement+learning+from+human+feedback" OR all:RLHF OR all:"direct+preference+optimization")',
    '(all:"efficient+training" OR all:"transformer-alternative" OR all:Mamba OR all:SSM)'
  ];
  const query = encodeURIComponent(`(${queryParts.join(' OR ')}) AND cat:cs.AI`);
  const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
  
  const response = await fetch(url);
  const xml = await response.text();
  
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
  return entries.map(entry => {
    const idMatch = entry.match(/<id>(.*?)<\/id>/);
    const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
    const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
    
    const rawId = idMatch ? idMatch[1].trim() : `arxiv-${Date.now()}`;
    const doi = rawId.split('/abs/').pop() || rawId; 
    
    return {
      doi: `arxiv-${doi}`,
      category: 'Artificial Intelligence & Foundational Models',
      sourceText: `Title: ${titleMatch ? titleMatch[1].trim() : ''}\nAbstract: ${summaryMatch ? summaryMatch[1].trim() : ''}`
    };
  });
}

// Domain 2: Cancer Research Fetch (Europe PMC prestige journals)
async function fetchPrestigeCancerPapers(maxResults = 75) {
  const journals = '("Blood" OR "JAMA" OR "Journal of Clinical Oncology" OR "ASH" OR "Journal of Extracellular Vesicles" OR "CELL" OR "NATURE" OR "SCIENCE")';
  const pubDateThreshold = '"2025-01-01"';
  
  // Use current system context for "till now"
  const currentDateStr = '"2026-09-23"'; 

  const query = encodeURIComponent(`(${journals}) AND (Leukemia OR Genomics OR Oncology OR cancer) AND OPEN_ACCESS:Y AND (FIRST_PUB_DATE:[${pubDateThreshold} TO ${currentDateStr}])`);
  
  const response = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${query}&format=json&resultType=core`);
  const data = await response.json();
  
  const results = data.resultList?.result || [];
  return results.slice(0, maxResults).map((item) => ({
    doi: item.doi || `pmc-${item.pmcid}`,
    category: 'Oncology & Genomics',
    sourceText: `Title: ${item.title}\nAbstract: ${item.abstractText || 'No abstract available.'}`
  }));
}

async function runBackfill() {
  console.log(`Starting massive local backfill... (Date range: Jan 1 2025 - Sep 23 2026)`);

  // 1. Fetch batches from both APIs
  console.log(`Fetching 100 AI papers and 75 high-prestige Cancer research papers...`);
  const [aiPapers, cancerPapers] = await Promise.all([
    fetchPrestigeAiPapers(100),
    fetchPrestigeCancerPapers(75)
  ]);
  const allPapers = [...aiPapers, ...cancerPapers];
  
  console.log(`Found ${allPapers.length} papers to process across domains.`);

  // 2. Loop and process one by one to avoid rate limits
  for (let i = 0; i < allPapers.length; i++) {
    const paper = allPapers[i];
    console.log(`[${i + 1}/${allPapers.length}] Processing: ${paper.doi}`);

    try {
      // 3. Skip duplicates
      const { data: existing } = await supabase.from('papers').select('id').eq('doi', paper.doi).single();
      if (existing) {
        console.log(`  -> Skipped. Already exists.`);
        continue;
      }

      // 4. Extract Data with Gemini 1.5 Flash
      const prompt = `Convert this academic paper or abstract text into a reader-friendly blog post. Because we only have the provided text, extract or intelligently infer a realistic data table that represents the key findings so we can chart it.

Crucially, assign a 'trending_score' (1-100) based on:
1. Journal/Venue Prestige: High impact factor venues (e.g., Blood, JAMA, JCO, NeurIPS, ICML) get higher baselines (80+). Breakthrough findings or multi-modal LLM advancements push toward 90-100.
2. Breakthrough Factor: Breakthrough clinical data or multi-modal foundation model advancements push toward 90-100.

Document Identifier: ${paper.doi}
Source Content:
${paper.sourceText}`;

      const aiResult = await model.generateContent(prompt);
      const parsedData = JSON.parse(aiResult.response.text());

      // 5. Generate Embedding with text-embedding-004
      const embedResult = await embeddingModel.embedContent(parsedData.blog_body_markdown);
      const vectorValues = embedResult.embedding.values;

      // 6. Bulk Insert (Commit to Supabase)
      const { error: insertError } = await supabase.from('papers').insert({
        doi: paper.doi,
        category: paper.category, 
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
      console.log(`  -> Success! Inserted "${parsedData.blog_title}"`);

    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
    }

    // 7. Enforce Rate Limit Delay
    console.log("  -> Sleeping 5 seconds to respect Gemini Rate Limit...");
    await delay(5000); 
  }
  
  console.log("Backfill complete! Your database and Galaxy Map are now populated with prestige research.");
}

runBackfill();
