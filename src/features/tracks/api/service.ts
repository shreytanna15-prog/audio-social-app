import { apiRequest } from '@/core/api';
import { readFileBytes } from '@/features/audio/data/file-persist';

import type {
  BackupCompleteResponse,
  BackupUploadUrlsResponse,
  CoverCompleteResponse,
  CoverContentType,
  CoverUploadUrlResponse,
  CreateTrackRequest,
  CreateTrackResponse,
  PublishedTrackItem,
  PublishTrackRequest,
  TrackListItem,
  TrackStatus,
  UnpublishTrackResponse,
  UpdateTrackRequest,
} from './types';

const WAV_CONTENT_TYPE = 'audio/wav';

export async function createTrack(
  body: CreateTrackRequest,
): Promise<CreateTrackResponse> {
  return apiRequest<CreateTrackResponse>({
    path: '/api/tracks',
    method: 'POST',
    body,
  });
}

export async function updateTrack(
  id: string,
  body: UpdateTrackRequest,
): Promise<CreateTrackResponse> {
  return apiRequest<CreateTrackResponse>({
    path: `/api/tracks/${id}`,
    method: 'PATCH',
    body,
  });
}

export async function listTracks(
  status?: TrackStatus,
): Promise<TrackListItem[]> {
  const query = status ? `?status=${status}` : '';
  return apiRequest<TrackListItem[]>({
    path: `/api/tracks${query}`,
    method: 'GET',
  });
}

export async function deleteTrack(id: string): Promise<CreateTrackResponse> {
  return apiRequest<CreateTrackResponse>({
    path: `/api/tracks/${id}`,
    method: 'DELETE',
  });
}

export async function createBackupUploadUrls(
  trackId: string,
): Promise<BackupUploadUrlsResponse> {
  return apiRequest<BackupUploadUrlsResponse>({
    path: `/api/tracks/${trackId}/backup/upload-urls`,
    method: 'POST',
  });
}

export async function completeBackup(
  trackId: string,
): Promise<BackupCompleteResponse> {
  return apiRequest<BackupCompleteResponse>({
    path: `/api/tracks/${trackId}/backup/complete`,
    method: 'POST',
  });
}

export async function uploadToSignedUrl(
  signedUrl: string,
  localUri: string,
): Promise<void> {
  const bytes = await readFileBytes(localUri);
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const response = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': WAV_CONTENT_TYPE,
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (${response.status}). Try again.`);
  }
}

export async function createCoverUploadUrl(
  trackId: string,
  contentType: CoverContentType,
): Promise<CoverUploadUrlResponse> {
  return apiRequest<CoverUploadUrlResponse>({
    path: `/api/tracks/${trackId}/cover/upload-url`,
    method: 'POST',
    body: { contentType },
  });
}

export async function completeCoverUpload(
  trackId: string,
  path: string,
): Promise<CoverCompleteResponse> {
  return apiRequest<CoverCompleteResponse>({
    path: `/api/tracks/${trackId}/cover/complete`,
    method: 'POST',
    body: { path },
  });
}

export async function deleteCover(trackId: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>({
    path: `/api/tracks/${trackId}/cover`,
    method: 'DELETE',
  });
}

export async function uploadCoverToSignedUrl(
  signedUrl: string,
  localUri: string,
  contentType: CoverContentType,
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

export async function publishTrack(
  trackId: string,
  body: PublishTrackRequest,
): Promise<PublishedTrackItem> {
  return apiRequest<PublishedTrackItem>({
    path: `/api/tracks/${trackId}/publish`,
    method: 'POST',
    body,
  });
}

export async function unpublishTrack(
  trackId: string,
): Promise<UnpublishTrackResponse> {
  return apiRequest<UnpublishTrackResponse>({
    path: `/api/tracks/${trackId}/unpublish`,
    method: 'POST',
  });
}

export async function uploadAndCompleteCover(
  trackId: string,
  localUri: string,
  contentType: CoverContentType,
): Promise<CoverCompleteResponse> {
  const upload = await createCoverUploadUrl(trackId, contentType);
  await uploadCoverToSignedUrl(upload.signedUrl, localUri, contentType);
  return completeCoverUpload(trackId, upload.path);
}
