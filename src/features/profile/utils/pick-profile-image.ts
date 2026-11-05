import * as ImagePicker from 'expo-image-picker';

import type { ProfileImageContentType } from '../api/types';

export type PickedProfileImage = {
  uri: string;
  contentType: ProfileImageContentType;
};

export type PickProfileImageResult =
  | { ok: true; uri: string; contentType: ProfileImageContentType }
  | { ok: false; canceled: true }
  | { ok: false; canceled: false; title: string; message: string };

function contentTypeFromMime(
  mimeType: string | null | undefined,
): ProfileImageContentType | null {
  if (!mimeType) return 'image/jpeg';
  const normalized = mimeType.toLowerCase();
  if (
    normalized === 'image/jpeg' ||
    normalized === 'image/jpg' ||
    normalized === 'image/png' ||
    normalized === 'image/webp'
  ) {
    return normalized as ProfileImageContentType;
  }
  return null;
}

async function ensureLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

async function ensureCameraPermission(): Promise<boolean> {
  const current = await ImagePicker.getCameraPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestCameraPermissionsAsync();
  return requested.granted;
}

async function fromResult(
  result: ImagePicker.ImagePickerResult,
): Promise<PickProfileImageResult> {
  if (result.canceled || !result.assets[0]) {
    return { ok: false, canceled: true };
  }
  const asset = result.assets[0];
  const contentType = contentTypeFromMime(asset.mimeType);
  if (!contentType) {
    return {
      ok: false,
      canceled: false,
      title: 'Unsupported image',
      message: 'Use JPEG, PNG, or WebP under 5 MB.',
    };
  }
  if (asset.fileSize != null && asset.fileSize > 5 * 1024 * 1024) {
    return {
      ok: false,
      canceled: false,
      title: 'Image too large',
      message: 'Images must be 5 MB or smaller.',
    };
  }
  return { ok: true, uri: asset.uri, contentType };
}

/** Avatar: 1:1 crop. Cover: wide crop matching profile hero (~screen width × 200). */
export async function pickProfileImage(params: {
  source: 'camera' | 'library';
  kind: 'avatar' | 'cover';
}): Promise<PickProfileImageResult> {
  const aspect: [number, number] =
    params.kind === 'avatar' ? [1, 1] : [16, 9];

  if (params.source === 'camera') {
    const ok = await ensureCameraPermission();
    if (!ok) {
      return {
        ok: false,
        canceled: false,
        title: 'Permission needed',
        message: 'Camera access is required to take a photo.',
      };
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.9,
    });
    return fromResult(result);
  }

  const ok = await ensureLibraryPermission();
  if (!ok) {
    return {
      ok: false,
      canceled: false,
      title: 'Permission needed',
      message: 'Photo library access is required to choose an image.',
    };
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.9,
  });
  return fromResult(result);
}
