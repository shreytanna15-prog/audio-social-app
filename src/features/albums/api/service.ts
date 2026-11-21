import { apiRequest } from '@/core/api';
import {
  uploadCoverToSignedUrl,
  type CoverCompleteResponse,
  type CoverContentType,
  type CoverUploadUrlResponse,
} from '@/features/tracks';

import type {
  AlbumDetailDto,
  AlbumSummaryDto,
  AttachAlbumTracksRequest,
  AttachAlbumTracksResponse,
  CreateAlbumRequest,
  DeleteAlbumResponse,
  UnlinkAlbumTrackResponse,
  UpdateAlbumRequest,
} from './types';

export async function listAlbums(): Promise<AlbumSummaryDto[]> {
  return apiRequest<AlbumSummaryDto[]>({
    path: '/api/albums',
    method: 'GET',
  });
}

export async function getAlbum(id: string): Promise<AlbumDetailDto> {
  return apiRequest<AlbumDetailDto>({
    path: `/api/albums/${id}`,
    method: 'GET',
  });
}

export async function createAlbum(
  body: CreateAlbumRequest,
): Promise<AlbumSummaryDto> {
  return apiRequest<AlbumSummaryDto>({
    path: '/api/albums',
    method: 'POST',
    body,
  });
}

export async function updateAlbum(
  id: string,
  body: UpdateAlbumRequest,
): Promise<AlbumSummaryDto> {
  return apiRequest<AlbumSummaryDto>({
    path: `/api/albums/${id}`,
    method: 'PATCH',
    body,
  });
}

export async function deleteAlbum(id: string): Promise<DeleteAlbumResponse> {
  return apiRequest<DeleteAlbumResponse>({
    path: `/api/albums/${id}`,
    method: 'DELETE',
  });
}

export async function releaseAlbum(id: string): Promise<AlbumSummaryDto> {
  return apiRequest<AlbumSummaryDto>({
    path: `/api/albums/${id}/release`,
    method: 'POST',
  });
}

export async function unreleaseAlbum(id: string): Promise<AlbumSummaryDto> {
  return apiRequest<AlbumSummaryDto>({
    path: `/api/albums/${id}/unrelease`,
    method: 'POST',
  });
}

export async function attachAlbumTracks(
  id: string,
  body: AttachAlbumTracksRequest,
): Promise<AttachAlbumTracksResponse> {
  return apiRequest<AttachAlbumTracksResponse>({
    path: `/api/albums/${id}/tracks`,
    method: 'POST',
    body,
  });
}

export async function listPublicAlbumsByUser(
  userId: string,
): Promise<AlbumSummaryDto[]> {
  return apiRequest<AlbumSummaryDto[]>({
    path: `/api/users/${userId}/albums`,
    method: 'GET',
  });
}

export async function unlinkAlbumTrack(
  albumId: string,
  trackId: string,
): Promise<UnlinkAlbumTrackResponse> {
  return apiRequest<UnlinkAlbumTrackResponse>({
    path: `/api/albums/${albumId}/tracks/${trackId}`,
    method: 'DELETE',
  });
}

export async function reorderAlbumTracks(
  albumId: string,
  trackIds: string[],
): Promise<{ id: string; trackIds: string[] }> {
  return apiRequest<{ id: string; trackIds: string[] }>({
    path: `/api/albums/${albumId}/tracks/reorder`,
    method: 'PUT',
    body: { trackIds },
  });
}

export async function createAlbumCoverUploadUrl(
  albumId: string,
  contentType: CoverContentType,
): Promise<CoverUploadUrlResponse> {
  return apiRequest<CoverUploadUrlResponse>({
    path: `/api/albums/${albumId}/cover/upload-url`,
    method: 'POST',
    body: { contentType },
  });
}

export async function completeAlbumCoverUpload(
  albumId: string,
  path: string,
): Promise<CoverCompleteResponse> {
  return apiRequest<CoverCompleteResponse>({
    path: `/api/albums/${albumId}/cover/complete`,
    method: 'POST',
    body: { path },
  });
}

export async function deleteAlbumCover(
  albumId: string,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>({
    path: `/api/albums/${albumId}/cover`,
    method: 'DELETE',
  });
}

export async function uploadAndCompleteAlbumCover(
  albumId: string,
  localUri: string,
  contentType: CoverContentType,
): Promise<CoverCompleteResponse> {
  const upload = await createAlbumCoverUploadUrl(albumId, contentType);
  await uploadCoverToSignedUrl(upload.signedUrl, localUri, contentType);
  return completeAlbumCoverUpload(albumId, upload.path);
}
