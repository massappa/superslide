// @ts-nocheck
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StreamingTextResponse, GoogleGenerativeAIStream } from "ai/google";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prompt, numberOfCards, language } = await req.json();
    if (!prompt || !numberOfCards || !language) {
      return new NextResponse("Missing required fields", { status: 400 });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const systemPrompt = `You are a world-class presentation outline generator.
    Your task is to take a user's topic and generate a structured outline for a presentation.
    - The user wants a presentation about: "${prompt}"
    - The presentation should have exactly ${numberOfCards} slides.
    - The language of the outline must be ${language}.
    - Each slide should be represented by a single line starting with '#'.
    - Each line should be a concise, compelling title for a slide.
    - Do NOT include any other text, explanations, or formatting. Only the lines starting with '#'.
    - Example for a 3-slide presentation on "History of Space Travel":
    # The Pioneers: From Gagarin to Armstrong
    # The Shuttle Era and the ISS
    # The Future: Mars and Beyond`;

    const result = await model.generateContentStream(systemPrompt);

    const stream = GoogleGenerativeAIStream(result);

    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error("Error generating presentation outline:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(JSON.stringify({ error: "Failed to generate presentation outline", details: errorMessage }), { status: 500 });
  }
}