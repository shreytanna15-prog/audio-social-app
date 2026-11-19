import { apiRequest } from '@/core/api';

import type {
  DiscoverTrackDto,
  FeaturedArtistDto,
  MadeForYouTrackDto,
} from './types';

export async function getFeaturedArtists(
  limit = 8,
): Promise<FeaturedArtistDto[]> {
  return apiRequest<FeaturedArtistDto[]>({
    path: `/api/discover/artists/featured?limit=${limit}`,
    method: 'GET',
  });
}

export async function getTrendingTracks(limit = 12): Promise<DiscoverTrackDto[]> {
  return apiRequest<DiscoverTrackDto[]>({
    path: `/api/discover/tracks/trending?limit=${limit}`,
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
