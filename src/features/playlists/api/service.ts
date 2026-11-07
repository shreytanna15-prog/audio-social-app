import { apiRequest } from '@/core/api';

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

export async function listPublicPlaylistsByUser(
  userId: string,
): Promise<PlaylistSummaryDto[]> {
  return apiRequest<PlaylistSummaryDto[]>({
    path: `/api/users/${userId}/playlists`,
    method: 'GET',
  });
}
