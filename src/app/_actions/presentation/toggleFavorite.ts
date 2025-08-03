"use server";
import { createClient } from "@/lib/supabase/server";

async function getUserId() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
}

export async function addToFavorites(presentationId: string) {
  try {
    const userId = await getUserId();
    const supabase = createClient();

    const { error } = await supabase
      .from('favorite_presentations')
      .insert({ user_id: userId, presentation_id: presentationId });

    if (error) {
      if (error.code === '23505') { // unique_violation
        return { success: true, message: "Already in favorites." };
      }
      throw error;
    }
    return { success: true, message: "Added to favorites." };
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return { success: false, error: "Failed to add to favorites." };
  }
}

export async function removeFromFavorites(presentationId: string) {
  try {
    const userId = await getUserId();
    const supabase = createClient();

    const { error } = await supabase
      .from('favorite_presentations')
      .delete()
      .eq('user_id', userId)
      .eq('presentation_id', presentationId);

    if (error) throw error;
    
    return { success: true, message: "Removed from favorites." };
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return { success: false, error: "Failed to remove from favorites." };
  }
}