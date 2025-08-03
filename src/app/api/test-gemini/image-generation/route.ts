import { GoogleGenAI, Modality } from "@google/genai";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return new Response("Missing GEMINI_API_KEY", { status: 500 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Use the correct API based on your example
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt || "A cute cat playing with a ball of yarn",
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the image data from the response with proper null checks
    let imageData: { data: string; mimeType: string } | null = null;
    
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
          imageData = {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType
          };
          break;
        }
      }
    }
    
    if (!imageData) {
      throw new Error("No image was generated");
    }
    
    return new Response(JSON.stringify({ imageData }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Error generating image with Gemini:", error);
    return new Response(`Error generating image with Gemini: ${error.message}`, { status: 500 });
  }
}