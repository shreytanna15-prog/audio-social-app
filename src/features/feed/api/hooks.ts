import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import { getFeed } from './service';

export const FEED_QUERY_KEY = ['feed'] as const;

export function useFeed(limit = 10) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: [...FEED_QUERY_KEY, limit],
    queryFn: ({ pageParam }) =>
      getFeed({
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });
}
