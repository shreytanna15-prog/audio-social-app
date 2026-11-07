import { apiRequest } from '@/core/api';

import type {
  AlbumSaveResponse,
  LikeActionResponse,
  LikedTrackItemDto,
  PlaylistSaveResponse,
  SavedAlbumItemDto,
  SavedPlaylistItemDto,
} from './types';

export async function likeTrack(trackId: string): Promise<LikeActionResponse> {
  return apiRequest<LikeActionResponse>({
    path: `/api/tracks/${trackId}/like`,
    method: 'POST',
  });
}

export async function unlikeTrack(
  trackId: string,
): Promise<LikeActionResponse> {
  return apiRequest<LikeActionResponse>({
    path: `/api/tracks/${trackId}/like`,
    method: 'DELETE',
  });
}

export async function listLikedTracks(): Promise<LikedTrackItemDto[]> {
  return apiRequest<LikedTrackItemDto[]>({
    path: '/api/likes/tracks',
    method: 'GET',
  });
}

export async function savePlaylist(
  playlistId: string,
): Promise<PlaylistSaveResponse> {
  return apiRequest<PlaylistSaveResponse>({
    path: `/api/playlists/${playlistId}/save`,
    method: 'POST',
  });
}

export async function unsavePlaylist(
  playlistId: string,
): Promise<PlaylistSaveResponse> {
  return apiRequest<PlaylistSaveResponse>({
    path: `/api/playlists/${playlistId}/save`,
    method: 'DELETE',
  });
}

export async function saveAlbum(albumId: string): Promise<AlbumSaveResponse> {
  return apiRequest<AlbumSaveResponse>({
    path: `/api/albums/${albumId}/save`,
    method: 'POST',
  });
}

export async function unsaveAlbum(albumId: string): Promise<AlbumSaveResponse> {
  return apiRequest<AlbumSaveResponse>({
    path: `/api/albums/${albumId}/save`,
    method: 'DELETE',
  });
}

export async function listSavedPlaylists(): Promise<SavedPlaylistItemDto[]> {
  return apiRequest<SavedPlaylistItemDto[]>({
    path: '/api/saves/playlists',
    method: 'GET',
  });
}

export async function listSavedAlbums(): Promise<SavedAlbumItemDto[]> {
  return apiRequest<SavedAlbumItemDto[]>({
    path: '/api/saves/albums',
    method: 'GET',
  });
}