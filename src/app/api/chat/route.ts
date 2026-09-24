// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Allow extra time for reading the full document context

export async function POST(req: Request) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  try {
    const { question, paperContent, chatHistory = [] } = await req.json();

    if (!question || !paperContent) {
      return NextResponse.json({ error: 'Question and paper content are required' }, { status: 400 });
    }

    // Using Gemini 1.5 Flash for its massive 1M+ token context window
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: "You are an expert scientific AI assistant. You will be provided with the text of a research paper. Answer the user's questions based ONLY on this paper. If the answer is not in the text, say 'The provided text does not contain this information.' Do not hallucinate or use outside knowledge.",
    });

    // Format previous messages for Gemini's history array
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Start a chat session, injecting the full paper as the very first contextual message
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `Here is the full text of the research paper:\n\n${paperContent}` }]
        },
        {
          role: 'model',
          parts: [{ text: 'I have successfully read the paper. What would you like to know?' }]
        },
        ...formattedHistory
      ],
      generationConfig: {
        temperature: 0.1, // Keep it highly factual
      }
    });

    const result = await chat.sendMessage(question);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
