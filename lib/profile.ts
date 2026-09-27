// Profile of the signed-in user. Identity (name, e-mail, role, dealer) comes
// from the JWT session issued by forward-api-java; the avatar is a device-local
// preference (AsyncStorage, keyed per user) so no personal photo leaves the phone.
// Perfil do usuario logado: identidade vem da sessao JWT; a foto fica so no aparelho.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { getSession, loadSession, type UserRole } from "./session";
import { STORAGE_KEYS } from "./storage-keys";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole;
  avatar_url: string | null;
  dealer_id: string | null;
  dealer_name: string | null;
  updated_at: string | null;
};

const avatarKey = (userId: string) => `${STORAGE_KEYS.AVATAR_PREFIX}${userId}`;

/** Returns the current user's profile, or null when not signed in. */
export async function fetchMyProfile(): Promise<Profile | null> {
  const session = getSession() ?? (await loadSession());
  if (!session) return null;
  const { user } = session;
  const avatar = await AsyncStorage.getItem(avatarKey(user.id)).catch(() => null);
  return {
    id: user.id,
    full_name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: avatar,
    dealer_id: user.dealer_id,
    dealer_name: user.dealer_name,
    updated_at: null,
  };
}

/** Only the avatar is editable on the device; identity fields are managed by ADMIN in the API. */
export async function updateMyProfile(patch: { avatar_url: string | null }): Promise<Profile> {
  const session = getSession() ?? (await loadSession());
  if (!session) throw new Error("Not authenticated");
  const key = avatarKey(session.user.id);
  if (patch.avatar_url) await AsyncStorage.setItem(key, patch.avatar_url);
  else await AsyncStorage.removeItem(key);
  const profile = await fetchMyProfile();
  return { ...profile!, updated_at: new Date().toISOString() };
}
