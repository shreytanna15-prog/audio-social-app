import { apiRequest } from '@/core/api';

import type {
  MusicSearchItem,
  RecordSearchRecentRequest,
  SearchRecentItem,
} from './types';

export async function searchMusic(
  q: string,
  limit = 30,
): Promise<MusicSearchItem[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest<MusicSearchItem[]>({
    path: `/api/search/music?${params.toString()}`,
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
