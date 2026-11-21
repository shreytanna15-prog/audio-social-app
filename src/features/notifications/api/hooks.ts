import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { ME_QUERY_KEY } from '@/features/profile/api/hooks';

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from './service';
import type { MarkNotificationsReadBody } from './types';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;
export const NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY = [
  ...NOTIFICATIONS_QUERY_KEY,
  'unread-count',
] as const;

export function useNotifications(limit = 30) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, 'list', limit],
    queryFn: ({ pageParam }) =>
      getNotifications({
        cursor: pageParam,
        limit,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isAuthenticated,
  });
}

export function useUnreadNotificationCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_QUERY_KEY,
    queryFn: getUnreadNotificationCount,
    enabled: isAuthenticated,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body?: MarkNotificationsReadBody) =>
      markNotificationsRead(body ?? {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
