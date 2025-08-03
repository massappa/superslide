import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { title, outline, language, tone, numSlides } = await req.json();
    if (!title || !outline || !Array.isArray(outline) || !language) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

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

    const result = await streamText({
      model: google("models/gemini-1.5-flash-latest"),
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error in presentation generation:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate presentation slides",
        details: errorMessage,
      }),
      { status: 500 },
    );
  }
}
