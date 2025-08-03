import { GoogleGenAI } from "@google/genai";

export const runtime = "edge";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function POST(req: Request) {
  try {
    const { prompt, numberOfCards, language } = await req.json();
    if (!prompt || !numberOfCards || !language) {
      return new Response("Missing required fields", { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    const generationPrompt = `You are a world-class presentation outline generator. Your task is to take a user's topic and generate a structured outline for a presentation.
- The user wants a presentation about: "${prompt}"
- The presentation should have exactly ${numberOfCards} slides.
- The language of the outline must be ${language}.
- Each slide should be represented by a single line starting with '#'.
- Each line should be a concise, compelling title for a slide.
- Do NOT include any other text, explanations, or formatting.
- Example for a 3-slide presentation on "History of Space Travel":
# The Pioneers: From Gagarin to Armstrong
# The Shuttle Era and the ISS
# The Future: Mars and Beyond`;

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: generationPrompt,
    });

    // Convert the streaming response to a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      }
    });
  } catch (error: any) {
    console.error("Error generating presentation outline:", error);
    return new Response(`Error generating presentation outline: ${error.message}`, { status: 500 });
  }
}