"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type ImageModelList = "imagen-3-flash"; // Simplified to one powerful model

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

    const imageModel = genAI.getGenerativeModel({ 
        model: "imagen-3-flash",
        generationConfig: {
            responseMimeType: "image/png"
        }
    });

    const result = await imageModel.generateContent([prompt]);
    const response = result.response;
    const imageData = response.candidates?.[0].content.parts[0].inlineData;

    if (!imageData?.data) {
      throw new Error("Failed to generate image data from Gemini.");
    }

    const imageBuffer = Buffer.from(imageData.data, "base64");
    const filename = `${user.id}/${prompt.substring(0, 20).replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("presentation_assets")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Error:", uploadError);
      throw new Error("Failed to upload image to storage.");
    }

    // Get public URL
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