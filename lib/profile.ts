// Profile helpers backed by the `public.profiles` table. Each authenticated
// user has exactly one row keyed by their auth user id (uuid). Created
// automatically on signup via a database trigger (see SETUP_PROFILES_AVATARS).
// Helpers do perfil — uma linha em public.profiles por user.

import { supabase } from "./supabase";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  dealer_id: string | null;
  updated_at: string | null;
};

/** Returns the current user's profile row, or null when not signed in. */
export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, dealer_id, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Patches a subset of the current user's profile. Returns the updated row. */
export async function updateMyProfile(
  patch: Partial<Pick<Profile, "full_name" | "avatar_url" | "dealer_id">>,
): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .select("id, full_name, avatar_url, dealer_id, updated_at")
    .single();

  if (error) throw error;
  return data;
}
