import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";
import { StreamingTextResponse, GoogleGenerativeAIStream } from "ai";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    
    const { title, outline, language, tone, numSlides } = await req.json();
    if (!title || !outline || !Array.isArray(outline) || !language) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const prompt = `
      You are an AI assistant that generates presentation content in a specific XML-like format.
      Your task is to create a full presentation based on the title and outline provided.

      **Presentation Details:**
      - Title: ${title}
      - Language: ${language}
      - Tone for images: ${tone}
      - Total Slides: ${numSlides}
      - Outline:
      ${outline.map((item, index) => `${index + 1}. ${item}`).join("\n")}

      **Output Format Rules (VERY IMPORTANT):**
      - The entire output must be wrapped in a single <PRESENTATION> tag.
      - Each slide is represented by a <SECTION> tag.
      - Each <SECTION> tag must have a 'page_number' attribute, starting from 1.
      - Use simple tags like <H1>, <H2>, <P>, <B>, <I>, etc.
      - You can use layouts by adding a 'layout' attribute to the <SECTION> tag (e.g., layout="left", layout="right", layout="vertical").
      - To suggest an image, use an <IMG> tag with an 'alt' attribute describing the image. The 'src' attribute should be a placeholder. E.g., <IMG src="placeholder.png" alt="A high-tech server room with glowing blue lights">.
      - Your response MUST be only the XML-like content. Do not include any other text, markdown, or explanations.
      - Ensure all tags are properly closed.

      **Example of a single SECTION:**
      <SECTION page_number="1" layout="left">
        <H1>The Dawn of AI</H1>
        <P>Exploring the early concepts and foundational algorithms that paved the way for modern artificial intelligence.</P>
        <IMG src="placeholder.png" alt="A vintage black and white photo of an early computer."/>
      </SECTION>

      Now, generate the complete presentation content for the provided details.
    `;
    
    const result = await model.generateContentStream(prompt);

    const stream = GoogleGenerativeAIStream(result, {
      // The SlideParser on the frontend expects raw text, but we need to wrap it in the JSON structure it now expects.
      // This is a bit of a hack to fit the existing manager, but avoids a larger refactor.
      // A better long-term solution would be to update the frontend to handle raw text streams.
      onCompletion: async (completion) => {
        // The parser logic is complex, so we'll just let the frontend parse the final complete XML.
      },
      onFinal: (final) => {
        // Since we stream, the 'final' callback might not be useful for the whole XML.
        // We will just stream the raw text and let the frontend piece it together.
      },
      // We will stream a custom format that the PresentationGenerationManager now understands
      transform: (chunk) => {
        return JSON.stringify({ type: "status-update", data: chunk, metadata: { author: "Gemini" } }) + "\n";
      }
    });

    return new StreamingTextResponse(stream, {
        headers: {
            "Content-Type": "application/json; charset=utf-8", 
            "Transfer-Encoding": "chunked",
        }
    });

  } catch (error) {
    console.error("Error in presentation generation:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(JSON.stringify({ error: "Failed to generate presentation slides", details: errorMessage }), { status: 500 });
  }
}