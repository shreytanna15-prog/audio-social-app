import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import {
  getFeaturedArtists,
  getMadeForYouTracks,
  getTrendingTracks,
} from './service';

export const FEATURED_ARTISTS_QUERY_KEY = ['discover', 'artists', 'featured'] as const;
export const TRENDING_TRACKS_QUERY_KEY = ['discover', 'tracks', 'trending'] as const;
export const MADE_FOR_YOU_QUERY_KEY = ['discover', 'tracks', 'made-for-you'] as const;

export function useFeaturedArtists(limit = 8) {
  return useQuery({
    queryKey: [...FEATURED_ARTISTS_QUERY_KEY, limit],
    queryFn: () => getFeaturedArtists(limit),
  });
}

export function useTrendingTracks(limit = 12) {
  return useQuery({
    queryKey: [...TRENDING_TRACKS_QUERY_KEY, limit],
    queryFn: () => getTrendingTracks(limit),
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
