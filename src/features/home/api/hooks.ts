import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import {
  getHomePlaylists,
  getLatestProject,
  getRecentlyPlayed,
} from './service';

export const LATEST_PROJECT_QUERY_KEY = ['projects', 'latest'] as const;
export const HOME_PLAYLISTS_QUERY_KEY = ['home', 'playlists'] as const;
export const RECENTLY_PLAYED_QUERY_KEY = ['me', 'recently-played'] as const;

export function useLatestProject() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: LATEST_PROJECT_QUERY_KEY,
    queryFn: getLatestProject,
    enabled: isAuthenticated,
  });
}

export function useHomePlaylists(limit = 8) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...HOME_PLAYLISTS_QUERY_KEY, limit],
    queryFn: () => getHomePlaylists(limit),
    enabled: isAuthenticated,
  });
}

export function useRecentlyPlayed(limit = 8) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...RECENTLY_PLAYED_QUERY_KEY, limit],
    queryFn: () => getRecentlyPlayed(limit),
    enabled: isAuthenticated,
  });
}
