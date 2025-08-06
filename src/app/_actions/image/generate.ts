"use server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs/promises";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export type ImageModelList = "imagen-3-flash";

export async function generateImageAction(
  prompt: string,
  _model: ImageModelList = "imagen-3-flash"
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log(`Generating image for prompt: ${prompt}`);

    const imageModel = genAI.getGenerativeModel({
      model: "imagen-3-flash",
      generationConfig: {
        responseMimeType: "image/png",
      },
    });

    const result = await imageModel.generateContent([prompt]);
    const response = result.response;
    const imageData = response.candidates?.[0].content.parts[0].inlineData;

    if (!imageData?.data) {
      throw new Error("Failed to generate image data from Gemini.");
    }

    const imageBuffer = Buffer.from(imageData.data, "base64");
    const filename = `${prompt
      .substring(0, 20)
      .replace(/[^a-z0-9]/gi, "_")}_${Date.now()}.png`;
    
    // Save to local public directory
    const imagePath = path.join(process.cwd(), "public", "generated_images", filename);
    await fs.writeFile(imagePath, imageBuffer);

    const publicUrl = `/generated_images/${filename}`;

    console.log(`Saved image locally: ${publicUrl}`);

    const { data: generatedImage, error: dbError } = await supabase
      .from("generated_images")
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
