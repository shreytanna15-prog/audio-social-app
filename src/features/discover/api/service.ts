import { apiRequest } from '@/core/api';

import type {
  DiscoverPlaylistDto,
  DiscoverTrackDto,
  FeaturedArtistDto,
  MadeForYouTrackDto,
  RisingArtistDto,
  TrendingWindow,
} from './types';

export async function getFeaturedArtists(
  limit = 8,
): Promise<FeaturedArtistDto[]> {
  return apiRequest<FeaturedArtistDto[]>({
    path: `/api/discover/artists/featured?limit=${limit}`,
    method: 'GET',
  });
}

export async function getRisingArtists(limit = 1): Promise<RisingArtistDto[]> {
  return apiRequest<RisingArtistDto[]>({
    path: `/api/discover/artists/rising?limit=${limit}`,
    method: 'GET',
  });
}

export async function getTrendingTracks(
  limit = 12,
  window: TrendingWindow = '30d',
): Promise<DiscoverTrackDto[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    window,
  });
  return apiRequest<DiscoverTrackDto[]>({
    path: `/api/discover/tracks/trending?${params.toString()}`,
    method: 'GET',
  });
}

export async function getDiscoverPlaylists(
  limit = 8,
): Promise<DiscoverPlaylistDto[]> {
  return apiRequest<DiscoverPlaylistDto[]>({
    path: `/api/discover/playlists?limit=${limit}`,
    method: 'GET',
  });
}

export async function getMadeForYouTracks(
  limit = 12,
): Promise<MadeForYouTrackDto[]> {
  return apiRequest<MadeForYouTrackDto[]>({
    path: `/api/discover/tracks/made-for-you?limit=${limit}`,
    method: 'GET',
  });
}
