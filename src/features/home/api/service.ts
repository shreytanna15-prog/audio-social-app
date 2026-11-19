import { apiRequest } from '@/core/api';

import type {
  HomePlaylistDto,
  LatestProjectDto,
  RecentlyPlayedDto,
} from './types';

export async function getLatestProject(): Promise<LatestProjectDto | null> {
  return apiRequest<LatestProjectDto | null>({
    path: '/api/projects/latest',
    method: 'GET',
  });
}

export async function getHomePlaylists(limit = 8): Promise<HomePlaylistDto[]> {
  return apiRequest<HomePlaylistDto[]>({
    path: `/api/home/playlists?limit=${limit}`,
    method: 'GET',
  });
}

export async function getRecentlyPlayed(
  limit = 8,
): Promise<RecentlyPlayedDto[]> {
  return apiRequest<RecentlyPlayedDto[]>({
    path: `/api/me/recently-played?limit=${limit}`,
    method: 'GET',
  });
}
