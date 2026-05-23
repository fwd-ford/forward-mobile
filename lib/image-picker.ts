// Thin wrapper over expo-image-picker. Forces 1:1 aspect (avatars are circular),
// 0.7 quality (good size/fidelity trade-off for ~100KB uploads), and prompts
// for permission only at use time, not at boot.
// Wrapper sobre expo-image-picker: 1:1, qualidade 0.7, permissao on-demand.

import * as ImagePicker from "expo-image-picker";

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
};

const AVATAR_OPTIONS = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.7,
};

export async function pickFromLibrary(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (perm.status !== "granted") return null;

  const result = await ImagePicker.launchImageLibraryAsync(AVATAR_OPTIONS);
  return resultToPicked(result);
}

export async function pickFromCamera(): Promise<PickedImage | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (perm.status !== "granted") return null;

  const result = await ImagePicker.launchCameraAsync(AVATAR_OPTIONS);
  return resultToPicked(result);
}

function resultToPicked(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
  };
}
