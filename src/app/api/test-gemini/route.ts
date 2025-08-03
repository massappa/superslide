import { GoogleGenAI } from "@google/genai";

export const runtime = "edge";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ?? "",
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    const response = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents: prompt || "Hello, how are you?",
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

    return new Response(stream);
  } catch (error: any) {
    console.error("Error testing Gemini:", error);
    return new Response(`Error testing Gemini: ${error.message}`, { status: 500 });
  }
}