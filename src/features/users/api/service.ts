import { apiRequest } from '@/core/api';

import type {
  FollowActionResult,
  PublicUserProfile,
  RecordSearchRecentRequest,
  SearchRecentItem,
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
