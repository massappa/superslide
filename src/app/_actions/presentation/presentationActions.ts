"use server";
import { createClient } from "@/lib/supabase/server"; // Corrected: Use server client
import { type PlateSlide } from "@/components/presentation/utils/parser";
import type { Presentation } from "@/types/database";

async function getUserId() {
    const supabase = createClient(); // Corrected: This is now the server client
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    return user.id;
}

export async function createPresentation(
  content: { slides: PlateSlide[] },
  title: string,
  theme = "default",
  outline?: string[],
  imageModel?: string,
  presentationStyle?: string,
  language?: string
) {
  try {
    const userId = await getUserId();
    const supabase = createClient();
    const { data: presentation, error } = await supabase
      .from('presentations')
      .insert({
        user_id: userId,
        title: title ?? "Untitled Presentation",
        content: content as any,
        theme,
        outline,
        image_model: imageModel,
        presentation_style: presentationStyle,
        language,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Presentation created successfully",
      presentation, // Corrected: No unnecessary nesting
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to create presentation",
    };
  }
}

export async function createEmptyPresentation(title: string, theme = "default") {
  const emptyContent: { slides: PlateSlide[] } = { slides: [] };
  return createPresentation(emptyContent, title, theme);
}

export async function updatePresentation({
  id,
  content,
  title,
  theme,
  outline,
  imageModel,
  presentationStyle,
  language,
}: {
  id: string;
  content?: { slides: PlateSlide[] };
  title?: string;
  theme?: string;
  outline?: string[];
  imageModel?: string;
  presentationStyle?: string;
  language?: string;
}) {
  try {
    const userId = await getUserId();
    const supabase = createClient();

    const updateData: Partial<Presentation> = {};
    if (content) updateData.content = content as any;
    if (title) updateData.title = title;
    if (theme) updateData.theme = theme;
    if (outline) updateData.outline = outline;
    if (imageModel) updateData.image_model = imageModel;
    if (presentationStyle) updateData.presentation_style = presentationStyle;
    if (language) updateData.language = language;

    const { data: presentation, error } = await supabase
      .from('presentations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: "Presentation updated successfully",
      presentation, // Corrected: No unnecessary nesting
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to update presentation",
    };
  }
}

export async function updatePresentationTitle(id: string, title: string) {
  return updatePresentation({ id, title });
}

export async function duplicatePresentation(id: string) {
  try {
    const userId = await getUserId();
    const supabase = createClient();

    const { data: original, error: fetchError } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !original) {
      throw new Error("Original presentation not found or access denied.");
    }
    
    const { data: newPresentation, error: createError } = await supabase
      .from('presentations')
      .insert({
        user_id: userId,
        title: `Copy of ${original.title}`,
        content: original.content,
        outline: original.outline,
        theme: original.theme,
        image_model: original.image_model,
        presentation_style: original.presentation_style,
        language: original.language,
      })
      .select()
      .single();

    if (createError) throw createError;

    return { success: true, message: "Presentation duplicated successfully", presentation: newPresentation };

  } catch (error) {
    console.error("Failed to duplicate presentation:", error);
    return { success: false, message: "Failed to duplicate presentation" };
  }
}

export async function deletePresentations(ids: string[]) {
  try {
    const userId = await getUserId();
    const supabase = createClient();
    const { count, error } = await supabase
        .from('presentations')
        .delete()
        .in('id', ids)
        .eq('user_id', userId);

    if (error) throw error;

    const deletedCount = count ?? 0;
    const failedCount = ids.length - deletedCount;

    if (failedCount > 0) {
      return {
        success: deletedCount > 0,
        message:
          deletedCount > 0
            ? `Deleted ${deletedCount} presentations, failed to delete ${failedCount}`
            : "Failed to delete presentations",
        partialSuccess: deletedCount > 0,
      };
    }

    return {
      success: true,
      message:
        ids.length === 1
          ? "Presentation deleted successfully"
          : `${deletedCount} presentations deleted successfully`,
    };
  } catch (error) {
    console.error("Failed to delete presentations:", error);
    return {
      success: false,
      message: "Failed to delete presentations",
    };
  }
}

export async function getPresentation(id: string) {
  try {
    const supabase = createClient();
    const { data: presentation, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
        console.log(error.message);
        return { success: false, message: "Presentation not found or access denied" };
    }

    return {
      success: true,
      presentation, // Corrected: No unnecessary nesting
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch presentation",
    };
  }
}

export async function getSlides(
  id: string,
): Promise<{ success: boolean; slides: PlateSlide[]; message?: string }> {
  try {
    const userId = await getUserId();
    const supabase = createClient();
    const { data, error } = await supabase
      .from("presentations")
      .select("content")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    if (!data || !data.content) {
      return { success: true, slides: [] }; // Return empty slides if no content
    }

    const content = data.content as { slides: PlateSlide[] };
    return { success: true, slides: content.slides ?? [] };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    console.error("Failed to fetch slides:", errorMessage);
    return { success: false, slides: [], message: "Failed to fetch slides." };
  }
}

export async function getPresentationContent(id: string) {
    try {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('presentations')
            .select('id, content, theme, outline')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!data) {
            return { success: false, message: "Presentation not found" };
        }
        return { success: true, presentation: data };
    } catch (error) {
        console.error(error);
        return { success: false, message: "Failed to fetch presentation content" };
    }
}
