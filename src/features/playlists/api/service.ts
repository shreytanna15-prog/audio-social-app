import { apiRequest } from '@/core/api';
import {
  uploadCoverToSignedUrl,
  type CoverCompleteResponse,
  type CoverContentType,
  type CoverUploadUrlResponse,
} from '@/features/tracks';

import type {
  AttachPlaylistTracksRequest,
  AttachPlaylistTracksResponse,
  CreatePlaylistRequest,
  DeletePlaylistResponse,
  PlaylistDetailDto,
  PlaylistSummaryDto,
  UnlinkPlaylistTrackResponse,
  UpdatePlaylistRequest,
} from './types';

export async function listPlaylists(): Promise<PlaylistSummaryDto[]> {
  return apiRequest<PlaylistSummaryDto[]>({
    path: '/api/playlists',
    method: 'GET',
  });
}

export async function getPlaylist(id: string): Promise<PlaylistDetailDto> {
  return apiRequest<PlaylistDetailDto>({
    path: `/api/playlists/${id}`,
    method: 'GET',
  });
}

export async function createPlaylist(
  body: CreatePlaylistRequest,
): Promise<PlaylistSummaryDto> {
  return apiRequest<PlaylistSummaryDto>({
    path: '/api/playlists',
    method: 'POST',
    body,
  });
}

export async function updatePlaylist(
  id: string,
  body: UpdatePlaylistRequest,
): Promise<PlaylistSummaryDto> {
  return apiRequest<PlaylistSummaryDto>({
    path: `/api/playlists/${id}`,
    method: 'PATCH',
    body,
  });
}

export async function deletePlaylist(
  id: string,
): Promise<DeletePlaylistResponse> {
  return apiRequest<DeletePlaylistResponse>({
    path: `/api/playlists/${id}`,
    method: 'DELETE',
  });
}

export async function attachPlaylistTracks(
  id: string,
  body: AttachPlaylistTracksRequest,
): Promise<AttachPlaylistTracksResponse> {
  return apiRequest<AttachPlaylistTracksResponse>({
    path: `/api/playlists/${id}/tracks`,
    method: 'POST',
    body,
  });
}

export async function unlinkPlaylistTrack(
  playlistId: string,
  trackId: string,
): Promise<UnlinkPlaylistTrackResponse> {
  return apiRequest<UnlinkPlaylistTrackResponse>({
    path: `/api/playlists/${playlistId}/tracks/${trackId}`,
    method: 'DELETE',
  });
}

export async function reorderPlaylistTracks(
  playlistId: string,
  trackIds: string[],
): Promise<{ id: string; trackIds: string[] }> {
  return apiRequest<{ id: string; trackIds: string[] }>({
    path: `/api/playlists/${playlistId}/tracks/reorder`,
    method: 'PUT',
    body: { trackIds },
  });
}

export async function listPublicPlaylistsByUser(
  userId: string,
): Promise<PlaylistSummaryDto[]> {
  return apiRequest<PlaylistSummaryDto[]>({
    path: `/api/users/${userId}/playlists`,
    method: 'GET',
  });
}

export async function createPlaylistCoverUploadUrl(
  playlistId: string,
  contentType: CoverContentType,
): Promise<CoverUploadUrlResponse> {
  return apiRequest<CoverUploadUrlResponse>({
    path: `/api/playlists/${playlistId}/cover/upload-url`,
    method: 'POST',
    body: { contentType },
  });
}

export async function completePlaylistCoverUpload(
  playlistId: string,
  path: string,
): Promise<CoverCompleteResponse> {
  return apiRequest<CoverCompleteResponse>({
    path: `/api/playlists/${playlistId}/cover/complete`,
    method: 'POST',
    body: { path },
  });
}

export async function deletePlaylistCover(
  playlistId: string,
): Promise<{ id: string }> {
  return apiRequest<{ id: string }>({
    path: `/api/playlists/${playlistId}/cover`,
    method: 'DELETE',
  });
}

export async function uploadAndCompletePlaylistCover(
  playlistId: string,
  localUri: string,
  contentType: CoverContentType,
): Promise<CoverCompleteResponse> {
  const upload = await createPlaylistCoverUploadUrl(playlistId, contentType);
  await uploadCoverToSignedUrl(upload.signedUrl, localUri, contentType);
  return completePlaylistCoverUpload(playlistId, upload.path);
}
