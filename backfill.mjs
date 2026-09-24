// backfill.mjs
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import * as dotenv from 'dotenv';

// Load your local environment variables
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define the exact schema we use in production
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

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: responseSchema,
    temperature: 0.2,
  }
});

const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

// Sleep helper to respect API rate limits (Gemini free tier allows 15 RPM)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchArxivPapers(searchQuery, categoryName, maxResults = 20) {
  const url = `http://export.arxiv.org/api/query?search_query=all:${searchQuery}&sortBy=submittedDate&sortOrder=descending&max_results=${maxResults}`;
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
      category: categoryName,
      sourceText: `Title: ${titleMatch ? titleMatch[1].trim() : ''}\nAbstract: ${summaryMatch ? summaryMatch[1].trim() : ''}`
    };
  });
}

async function runBackfill() {
  console.log("Starting massive document backfill...");

  // Fetch batches across distinct domains
  const batches = await Promise.all([
    fetchArxivPapers('generative+video+models+flux+veo+kling', 'AI Video Generation', 20),
    fetchArxivPapers('genomics+leukemia+mortality+prediction', 'Clinical Oncology ML', 20),
    fetchArxivPapers('quantitative+sports+analytics+tennis+basketball+soccer', 'Sports Analytics', 20),
    fetchArxivPapers('retrieval+augmented+generation+vector+database', 'AI Infrastructure', 20)
  ]);

  const allPapers = batches.flat();
  console.log(`Found ${allPapers.length} papers to process.`);

  for (let i = 0; i < allPapers.length; i++) {
    const paper = allPapers[i];
    console.log(`[${i + 1}/${allPapers.length}] Processing: ${paper.doi}`);

    try {
      // 1. Skip if already in database
      const { data: existing } = await supabase.from('papers').select('id').eq('doi', paper.doi).single();
      if (existing) {
        console.log(`  -> Skipped. Already exists.`);
        continue;
      }

      // 2. Extract Data via Gemini
      const prompt = `Convert this academic paper or abstract text into a reader-friendly blog post. Extract or intelligently infer a realistic data table that represents the key findings so we can chart it. Assign a 'trending_score' (1-100).
      
      Document Identifier: ${paper.doi}
      Source Content:
      ${paper.sourceText}`;

      const aiResult = await model.generateContent(prompt);
      const parsedData = JSON.parse(aiResult.response.text());

      // 3. Generate Vector Embedding
      const embedResult = await embeddingModel.embedContent(parsedData.blog_body_markdown);
      const vectorValues = embedResult.embedding.values;

      // 4. Save to Supabase
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
      
      console.log(`  -> Success! Inserted ${parsedData.blog_title}`);

    } catch (err) {
      console.error(`  -> Failed: ${err.message}`);
    }

    // Wait 5 seconds between requests to respect Gemini Free Tier (15 requests/min)
    console.log("  -> Sleeping for 5s to respect rate limits...");
    await delay(5000); 
  }
  
  console.log("Backfill complete! Your database is fully loaded.");
}

runBackfill();
