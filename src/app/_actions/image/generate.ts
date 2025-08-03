"use server";
import { GoogleGenAI, Modality } from "@google/genai";
import { createClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export type ImageModelList = "imagen-3-flash"; 

export async function generateImageAction(
  prompt: string,
  _model: ImageModelList = "imagen-3-flash"
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log(`Generating image for prompt: ${prompt}`);

    // Use the image generation model with proper configuration
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Extract the image data from the response
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
      throw new Error("Failed to generate image data from Gemini.");
    }

    const imageBuffer = Buffer.from(imageData.data, "base64");
    const filename = `${user.id}/${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("presentation_assets")
      .upload(filename, imageBuffer, {
        contentType: imageData.mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error("Failed to upload image to storage.");
    }

    const { data: { publicUrl } } = supabase.storage
      .from("presentation_assets")
      .getPublicUrl(uploadData.path);

    if (!publicUrl) {
      throw new Error("Failed to get public URL for the image.");
    }

    console.log(`Uploaded to Supabase Storage: ${publicUrl}`);
    const { data: generatedImage, error: dbError } = await supabase
      .from('generated_images')
      .insert({
        url: publicUrl,
        prompt: prompt,
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database Insert Error:", dbError);
      throw new Error("Failed to save image record to database.");
    }

    return {
      success: true,
      image: generatedImage,
    };
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}