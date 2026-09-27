// Avatar pipeline (device-local). The picked/captured image stays on the phone
// (LGPD: minimisation, the backend never receives a personal photo); the URI
// is persisted per user by lib/profile.ts.
// Pipeline do avatar local: a foto nao sai do aparelho (minimizacao de dados).

import type { PickedImage } from "./image-picker";

/** Returns the URI to persist on the profile. */
export async function uploadAvatar(picked: PickedImage): Promise<string> {
  if (!picked.uri) throw new Error("Imagem inválida");
  return picked.uri;
}

/** Nothing to delete remotely; clearing the profile field removes the reference. */
export async function deleteAvatar(): Promise<void> {
  return Promise.resolve();
}
