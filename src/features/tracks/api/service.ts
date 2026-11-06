import { apiRequest } from '@/core/api';
import { readFileBytes } from '@/features/audio/data/file-persist';

import type {
  BackupCompleteResponse,
  BackupUploadUrlsResponse,
  CreateTrackRequest,
  CreateTrackResponse,
  TrackListItem,
  TrackStatus,
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
