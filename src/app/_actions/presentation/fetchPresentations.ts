"use server";
import { createClient } from "@/lib/supabase/server";
import type { Presentation } from "@/types/database";

const PAGE_SIZE = 10;

interface FetchResponse {
  items: Presentation[];
  hasMore: boolean;
}

export async function fetchPresentations(page: number = 0): Promise<FetchResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { items: [], hasMore: false };
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  const { data, error, count } = await supabase
    .from('presentations')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .range(from, to - 1);

  if (error) {
    console.error("Error fetching presentations:", error);
    return { items: [], hasMore: false };
  }
  
  const hasMore = (count ?? 0) > to;

  return { items: data || [], hasMore };
}