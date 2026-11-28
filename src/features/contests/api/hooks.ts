import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';

import {
  castContestVote,
  getContest,
  getContestLeaderboard,
  listContestEntries,
  listContests,
  listEligibleTracks,
  submitContestEntry,
} from './service';

export const CONTESTS_QUERY_KEY = ['contests'] as const;

export function useContests(tab: 'upcoming' | 'active' | 'closed') {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CONTESTS_QUERY_KEY, 'list', tab],
    queryFn: () => listContests(tab),
    enabled: isAuthenticated,
  });
}

export function useContest(id: string) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CONTESTS_QUERY_KEY, 'detail', id],
    queryFn: () => getContest(id),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useContestEntries(id: string, limit = 20) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useInfiniteQuery({
    queryKey: [...CONTESTS_QUERY_KEY, 'entries', id, limit],
    queryFn: ({ pageParam }) =>
      listContestEntries(id, { cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useContestLeaderboard(id: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CONTESTS_QUERY_KEY, 'leaderboard', id],
    queryFn: () => getContestLeaderboard(id),
    enabled: isAuthenticated && Boolean(id) && enabled,
  });
}

export function useEligibleTracks(id: string, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: [...CONTESTS_QUERY_KEY, 'eligible', id],
    queryFn: () => listEligibleTracks(id),
    enabled: isAuthenticated && Boolean(id) && enabled,
  });
}

export function useSubmitContestEntry(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => submitContestEntry(contestId, trackId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CONTESTS_QUERY_KEY,
      });
    },
  });
}

export function useCastContestVote(contestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entryId: string) => castContestVote(contestId, entryId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: CONTESTS_QUERY_KEY,
      });
    },
  });
}
