import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Service Role Supabase client for backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Google Gen AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { doi, sourceText } = await req.json();

    if (!doi) {
      return NextResponse.json({ error: 'DOI or document identifier required' }, { status: 400 });
    }

    // STEP 1: Cache Lookup (<50ms resolve)
    const { data: cachedPaper, error: cacheError } = await supabase
      .from('papers')
      .select('*')
      .eq('doi', doi)
      .single();

    if (cachedPaper) {
      return NextResponse.json({ data: cachedPaper, source: 'cache' });
    }

    // STEP 2: AI Processing (Cache Miss)
    // Enforcing strict JSON schema for stable frontend charting
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        blog_title: { type: SchemaType.STRING },
        tldr_bullets: { 
          type: SchemaType.ARRAY, 
          items: { type: SchemaType.STRING } 
        },
        blog_body_markdown: { type: SchemaType.STRING },
        chart_data_json: {
          type: SchemaType.OBJECT,
          properties: {
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
          required: ["chart_title", "x_axis_label", "y_axis_label", "data_points"]
        }
      },
      required: ["blog_title", "tldr_bullets", "blog_body_markdown", "chart_data_json"]
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
        temperature: 0.2, // Low temperature for high analytical accuracy
      }
    });

    const prompt = `Analyze the following academic paper text. Extract a compelling blog-style title, exactly 3 TLDR bullet points summarizing key findings, a structured markdown narrative of the background/discoveries/limitations, and extract the most prominent data table into a standardized chart array format.\n\nPaper Text: ${sourceText}`;

    const result = await model.generateContent(prompt);
    const parsedData = JSON.parse(result.response.text());

    // STEP 3: Cache Commit & Return
    const { data: newPaper, error: insertError } = await supabase
      .from('papers')
      .insert({
        doi,
        blog_title: parsedData.blog_title,
        tldr_bullets: parsedData.tldr_bullets,
        blog_body_markdown: parsedData.blog_body_markdown,
        chart_data_json: parsedData.chart_data_json
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
