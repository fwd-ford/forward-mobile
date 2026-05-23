// Avatar upload pipeline. Reads the local file from a PickedImage URI, uploads
// to the public `avatars` bucket under `<userId>/avatar.<ext>`, and returns the
// public URL. Uses upsert so re-uploading replaces the previous avatar.
// Pipeline de upload do avatar: bucket publico avatars, path <userId>/avatar.<ext>.

import { supabase } from "./supabase";
import type { PickedImage } from "./image-picker";

const BUCKET = "avatars";

/** Uploads the picked image and returns the public URL to persist on the profile. */
export async function uploadAvatar(picked: PickedImage): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  const ext = inferExtension(picked.mimeType);
  const path = `${userId}/avatar.${ext}`;
  const contentType = picked.mimeType;

  // RN fetch on a local file URI yields a Blob the SDK can upload.
  // Em RN, fetch num URI local retorna Blob — Supabase SDK aceita direto.
  const response = await fetch(picked.uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType, upsert: true });
  if (error) throw error;

  // Cache buster forces fresh fetch when the user re-uploads — same URL stays
  // cached on the device CDN otherwise.
  // Cache buster: forca reload no device quando trocar a foto.
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

/** Removes the avatar object so the placeholder takes over again. */
export async function deleteAvatar(): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // Try both extensions — we do not know which one was used last.
  const paths = ["jpg", "jpeg", "png", "webp"].map((ext) => `${userId}/avatar.${ext}`);
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw error;
}

function inferExtension(mimeType: string): string {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}
