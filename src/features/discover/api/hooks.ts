import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import {
  getDiscoverPlaylists,
  getFeaturedArtists,
  getMadeForYouTracks,
  getRisingArtists,
  getTrendingTracks,
} from './service';
import type { TrendingWindow } from './types';

export const FEATURED_ARTISTS_QUERY_KEY = ['discover', 'artists', 'featured'] as const;
export const RISING_ARTISTS_QUERY_KEY = ['discover', 'artists', 'rising'] as const;
export const TRENDING_TRACKS_QUERY_KEY = ['discover', 'tracks', 'trending'] as const;
export const DISCOVER_PLAYLISTS_QUERY_KEY = ['discover', 'playlists'] as const;
export const MADE_FOR_YOU_QUERY_KEY = ['discover', 'tracks', 'made-for-you'] as const;

export function useFeaturedArtists(limit = 8) {
  return useQuery({
    queryKey: [...FEATURED_ARTISTS_QUERY_KEY, limit],
    queryFn: () => getFeaturedArtists(limit),
  });
}

export function useRisingArtists(limit = 1) {
  return useQuery({
    queryKey: [...RISING_ARTISTS_QUERY_KEY, limit],
    queryFn: () => getRisingArtists(limit),
  });
}

export function useTrendingTracks(limit = 12, window: TrendingWindow = '30d') {
  return useQuery({
    queryKey: [...TRENDING_TRACKS_QUERY_KEY, window, limit],
    queryFn: () => getTrendingTracks(limit, window),
  });
}

export function useDiscoverPlaylists(limit = 8) {
  return useQuery({
    queryKey: [...DISCOVER_PLAYLISTS_QUERY_KEY, limit],
    queryFn: () => getDiscoverPlaylists(limit),
  });
}

export function useMadeForYouTracks(limit = 12) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...MADE_FOR_YOU_QUERY_KEY, limit],
    queryFn: () => getMadeForYouTracks(limit),
    enabled: isAuthenticated,
  });
}
