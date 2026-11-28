import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import { getWallet } from './service';

export const WALLET_QUERY_KEY = ['wallet'] as const;

export function useWallet(limit = 20) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: [...WALLET_QUERY_KEY, 'me', limit],
    queryFn: ({ pageParam }) =>
      getWallet({
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });
}
