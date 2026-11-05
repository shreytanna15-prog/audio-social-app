import { apiRequest } from '@/core/api';

import type {
  MeDto,
  PatchProfileBody,
  ProfileImageContentType,
  ProfileMediaCompleteBody,
  ProfileMediaUpload,
  UsernameAvailability,
} from './types';

export async function getMe(): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user',
    method: 'GET',
  });
}

export async function patchMe(body: PatchProfileBody): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user',
    method: 'PATCH',
    body,
  });
}

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailability> {
  const params = new URLSearchParams({ username });
  return apiRequest<UsernameAvailability>({
    path: `/api/user/username-availability?${params.toString()}`,
    method: 'GET',
  });
}

export async function createAvatarUploadUrl(
  contentType: ProfileImageContentType,
): Promise<ProfileMediaUpload> {
  return apiRequest<ProfileMediaUpload>({
    path: '/api/user/avatar/upload-url',
    method: 'POST',
    body: { contentType },
  });
}

export async function completeAvatarUpload(
  body: ProfileMediaCompleteBody,
): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user/avatar',
    method: 'POST',
    body,
  });
}

export async function deleteAvatar(): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user/avatar',
    method: 'DELETE',
  });
}

export async function createCoverUploadUrl(
  contentType: ProfileImageContentType,
): Promise<ProfileMediaUpload> {
  return apiRequest<ProfileMediaUpload>({
    path: '/api/user/cover/upload-url',
    method: 'POST',
    body: { contentType },
  });
}

export async function completeCoverUpload(
  body: ProfileMediaCompleteBody,
): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user/cover',
    method: 'POST',
    body,
  });
}

export async function deleteCover(): Promise<MeDto> {
  return apiRequest<MeDto>({
    path: '/api/user/cover',
    method: 'DELETE',
  });
}

export async function uploadProfileImage(
  signedUrl: string,
  localUri: string,
  contentType: ProfileImageContentType,
): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status}). Try again.`);
  }
}
