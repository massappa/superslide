"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { utapi } from "@/hooks/globals/useUploadthing";

// Schema for creating/updating a theme
const themeSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
  themeData: z.any(), // We'll validate this as ThemeProperties in the function
  logoUrl: z.string().optional(),
  isPublic: z.boolean().optional().default(false),
});

export type ThemeFormData = z.infer<typeof themeSchema>;

// Create a new custom theme
export async function createCustomTheme(formData: ThemeFormData) {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = themeSchema.parse(formData);

    const { data: newTheme, error } = await supabase
      .from("custom_themes")
      .insert({
        name: validatedData.name,
        description: validatedData.description,
        theme_data: validatedData.themeData,
        logo_url: validatedData.logoUrl,
        is_public: validatedData.isPublic,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (error) throw error;

    return {
      success: true,
      themeId: newTheme.id,
      message: "Theme created successfully",
    };
  } catch (error) {
    console.error("Failed to create custom theme:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid theme data. Please check your inputs and try again.",
      };
    }
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

// Update an existing custom theme
export async function updateCustomTheme(
  themeId: string,
  formData: ThemeFormData,
) {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const validatedData = themeSchema.parse(formData);

    const { data: existingTheme, error: fetchError } = await supabase
      .from("custom_themes")
      .select("user_id")
      .eq("id", themeId)
      .single();

    if (fetchError || !existingTheme) {
      return { success: false, message: "Theme not found" };
    }

    if (existingTheme.user_id !== user.id) {
      return { success: false, message: "Unauthorized" };
    }

    const { error } = await supabase
      .from("custom_themes")
      .update({
        name: validatedData.name,
        description: validatedData.description,
        theme_data: validatedData.themeData,
        logo_url: validatedData.logoUrl,
        is_public: validatedData.isPublic,
      })
      .eq("id", themeId);

    if (error) throw error;

    return {
      success: true,
      message: "Theme updated successfully",
    };
  } catch (error) {
    console.error("Failed to update custom theme:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid theme data. Please check your inputs and try again.",
      };
    }
    return {
      success: false,
      message: "Something went wrong. Please try again later.",
    };
  }
}

// Delete a custom theme
export async function deleteCustomTheme(themeId: string) {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: "Unauthorized" };
    }

    const { data: existingTheme, error: fetchError } = await supabase
      .from("custom_themes")
      .select("user_id, logo_url")
      .eq("id", themeId)
      .single();

    if (fetchError || !existingTheme) {
      return { success: false, message: "Theme not found" };
    }

    if (existingTheme.user_id !== user.id) {
      return { success: false, message: "Unauthorized" };
    }

    if (existingTheme.logo_url) {
      try {
        const fileKey = existingTheme.logo_url.split("/").pop();
        if (fileKey) {
          await utapi.deleteFiles(fileKey);
        }
      } catch (deleteError) {
        console.error("Failed to delete theme logo:", deleteError);
      }
    }

    const { error } = await supabase
      .from("custom_themes")
      .delete()
      .eq("id", themeId);

    if (error) throw error;

    return {
      success: true,
      message: "Theme deleted successfully",
    };
  } catch (error) {
    console.error("Failed to delete custom theme:", error);
    return {
      success: false,
      message:
        "Something went wrong while deleting the theme. Please try again later.",
    };
  }
}

// Get all custom themes for the current user
export async function getUserCustomThemes() {
  const supabase = createClient();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: true, themes: [] };
    }

    const { data: themes, error } = await supabase
      .from("custom_themes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      themes,
    };
  } catch (error) {
    console.error("Failed to fetch custom themes:", error);
    return {
      success: false,
      message: "Unable to load themes at this time. Please try again later.",
      themes: [],
    };
  }
}

// Get all public themes
export async function getPublicCustomThemes() {
  const supabase = createClient();
  try {
    const { data: themes, error } = await supabase
      .from("custom_themes")
      .select("*, user:users(name)")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      success: true,
      themes,
    };
  } catch (error) {
    console.error("Failed to fetch public themes:", error);
    return {
      success: false,
      message:
        "Unable to load public themes at this time. Please try again later.",
      themes: [],
    };
  }
}

// Get a single theme by ID
export async function getCustomThemeById(themeId: string) {
  const supabase = createClient();
  try {
    const { data: theme, error } = await supabase
      .from("custom_themes")
      .select("*, user:users(name)")
      .eq("id", themeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // PostgREST error code for "Not a single row was returned"
        return { success: false, message: "Theme not found" };
      }
      throw error;
    }

    if (!theme) {
      return { success: false, message: "Theme not found" };
    }

    return {
      success: true,
      theme,
    };
  } catch (error) {
    console.error("Failed to fetch theme:", error);
    return {
      success: false,
      message: "Unable to load the theme at this time. Please try again later.",
    };
  }
}
