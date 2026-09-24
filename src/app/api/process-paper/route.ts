import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType, Schema } from '@google/generative-ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    const { doi, sourceText } = await req.json();

    if (!doi || !sourceText) {
      return NextResponse.json({ error: 'DOI or document identifier and source text are required' }, { status: 400 });
    }

    // STEP 1: Cache Lookup (<50ms resolve)
    const { data: cachedPaper } = await supabase
      .from('papers')
      .select('*')
      .eq('doi', doi)
      .single();

    if (cachedPaper) {
      return NextResponse.json({ data: cachedPaper, source: 'cache' });
    }

    // STEP 2: AI Processing (Cache Miss)
    const responseSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        blog_title: { type: SchemaType.STRING },
        tldr_bullets: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING } 
        },
        blog_body_markdown: { type: SchemaType.STRING },
        limitations_and_biases: { 
          type: SchemaType.STRING, 
          description: "A critical analysis of the study's flaws, small sample sizes, or methodological biases." 
        },
        github_repo_link: { 
          type: SchemaType.STRING, 
          description: "Extract the GitHub repository URL if mentioned, otherwise return null.",
          nullable: true
        },
        trending_score: { 
          type: SchemaType.INTEGER, 
          description: "A score from 1 to 100 based on journal impact factor, breakthrough significance, and topic popularity." 
        },
        chart_data_json: {
          type: SchemaType.OBJECT,
          properties: {
            chart_type: { 
              type: SchemaType.STRING,
              description: "Must be one of: 'bar', 'line', 'pie', or 'scatter' based on what fits the data best."
            },
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
      model: 'gemini-3.6-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });

    const prompt = `Convert this academic paper or abstract text into a reader-friendly blog post. Because we only have the provided text, extract or intelligently infer a realistic data table that represents the key findings so we can chart it.

Crucially, assign a 'trending_score' (1-100) based on:
1. Journal/Venue Prestige: High impact factor venues (e.g., Blood, JAMA, JCO, NeurIPS, ICML) get higher baselines (80+).
2. Topic Popularity & Breakthrough Factor: Breakthrough findings, synthetic lethality, or major foundation model advancements push toward 90-100.

Document Identifier: ${doi}
Source Content:
${sourceText}`;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    // STEP 3: Generate Vector Embedding for Semantic Search / Recommendations
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const embedResult = await embeddingModel.embedContent(parsedData.blog_body_markdown);
    const vectorValues = embedResult.embedding.values;

    // STEP 4: Cache Commit & Return
    const { data: newPaper, error: insertError } = await supabase
      .from('papers')
      .insert({
        doi,
        blog_title: parsedData.blog_title,
        tldr_bullets: parsedData.tldr_bullets,
        blog_body_markdown: parsedData.blog_body_markdown,
        trending_score: parsedData.trending_score,
        chart_data_json: parsedData.chart_data_json,
        limitations_and_biases: parsedData.limitations_and_biases,
        github_repo_link: parsedData.github_repo_link,
        embedding: vectorValues // Saving the 768-dimensional array
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ data: newPaper, source: 'ai_generated' });

  } catch (error: any) {
    console.error('Pipeline Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
