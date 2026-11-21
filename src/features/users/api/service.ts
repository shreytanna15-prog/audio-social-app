import { apiRequest } from '@/core/api';

import type {
  FollowActionResult,
  FollowListPage,
  PublicUserProfile,
  RecordSearchRecentRequest,
  SearchAlbumItem,
  SearchPlaylistItem,
  SearchRecentItem,
  SearchTrackItem,
  UserSearchResult,
} from './types';

export async function searchUsers(
  q: string,
  limit = 20,
): Promise<UserSearchResult[]> {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });
  return apiRequest<UserSearchResult[]>({
    path: `/api/users/search?${params.toString()}`,
    method: 'GET',
  });
}

export async function getPublicProfile(
  id: string,
): Promise<PublicUserProfile> {
  return apiRequest<PublicUserProfile>({
    path: `/api/users/${id}`,
    method: 'GET',
  });
}

export async function followUser(id: string): Promise<FollowActionResult> {
  return apiRequest<FollowActionResult>({
    path: `/api/users/${id}/follow`,
    method: 'POST',
  });
}

export async function unfollowUser(id: string): Promise<FollowActionResult> {
  return apiRequest<FollowActionResult>({
    path: `/api/users/${id}/follow`,
    method: 'DELETE',
  });
}

export async function listFollowers(
  id: string,
  opts?: { limit?: number; cursor?: string },
): Promise<FollowListPage> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiRequest<FollowListPage>({
    path: `/api/users/${id}/followers${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
}

export async function listFollowing(
  id: string,
  opts?: { limit?: number; cursor?: string },
): Promise<FollowListPage> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set('limit', String(opts.limit));
  if (opts?.cursor) params.set('cursor', opts.cursor);
  const qs = params.toString();
  return apiRequest<FollowListPage>({
    path: `/api/users/${id}/following${qs ? `?${qs}` : ''}`,
    method: 'GET',
  });
}

export async function searchTracks(
  q: string,
  limit = 20,
): Promise<SearchTrackItem[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest<SearchTrackItem[]>({
    path: `/api/tracks/search?${params.toString()}`,
    method: 'GET',
  });
}

export async function searchPlaylists(
  q: string,
  limit = 20,
): Promise<SearchPlaylistItem[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest<SearchPlaylistItem[]>({
    path: `/api/playlists/search?${params.toString()}`,
    method: 'GET',
  });
}

export async function searchAlbums(
  q: string,
  limit = 20,
): Promise<SearchAlbumItem[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest<SearchAlbumItem[]>({
    path: `/api/albums/search?${params.toString()}`,
    method: 'GET',
  });
}

export async function listSearchRecent(): Promise<SearchRecentItem[]> {
  return apiRequest<SearchRecentItem[]>({
    path: '/api/search/recent',
    method: 'GET',
  });
}

export async function recordSearchRecent(
  body: RecordSearchRecentRequest,
): Promise<SearchRecentItem[]> {
  return apiRequest<SearchRecentItem[]>({
    path: '/api/search/recent',
    method: 'POST',
    body,
  });
}

export async function clearSearchRecent(): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>({
    path: '/api/search/recent',
    method: 'DELETE',
  });
}

export async function removeSearchRecent(
  id: string,
): Promise<SearchRecentItem[]> {
  return apiRequest<SearchRecentItem[]>({
    path: `/api/search/recent/${id}`,
    method: 'DELETE',
  });
}
