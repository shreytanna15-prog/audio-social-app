import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clearSearchRecent,
  followUser,
  getPublicProfile,
  listSearchRecent,
  recordSearchRecent,
  removeSearchRecent,
  searchUsers,
  unfollowUser,
} from './service';
import type {
  FollowActionResult,
  PublicUserProfile,
  RecordSearchRecentRequest,
  SearchRecentItem,
} from './types';

export const USERS_SEARCH_QUERY_KEY = ['users', 'search'] as const;
export const SEARCH_RECENT_QUERY_KEY = ['search', 'recent'] as const;
export const USER_PROFILE_QUERY_KEY = ['users', 'profile'] as const;

export function useSearchUsers(q: string, enabled = true) {
  const trimmed = q.trim();

  return useQuery({
    queryKey: [...USERS_SEARCH_QUERY_KEY, trimmed],
    queryFn: () => searchUsers(trimmed),
    enabled: enabled && trimmed.length >= 1,
  });
}

export function useSearchRecent() {
  return useQuery({
    queryKey: SEARCH_RECENT_QUERY_KEY,
    queryFn: listSearchRecent,
  });
}

export function useRecordSearchRecent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: RecordSearchRecentRequest) => recordSearchRecent(body),
    onSuccess: async (data) => {
      queryClient.setQueryData(SEARCH_RECENT_QUERY_KEY, data);
    },
  });
}

export function useClearSearchRecent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearSearchRecent,
    onSuccess: async () => {
      queryClient.setQueryData(SEARCH_RECENT_QUERY_KEY, []);
    },
  });
}

export function useRemoveSearchRecent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeSearchRecent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SEARCH_RECENT_QUERY_KEY });
      const previous =
        queryClient.getQueryData<SearchRecentItem[]>(SEARCH_RECENT_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData(
          SEARCH_RECENT_QUERY_KEY,
          previous.filter((item) => item.id !== id),
        );
      }
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SEARCH_RECENT_QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(SEARCH_RECENT_QUERY_KEY, data);
    },
  });
}

export function usePublicUserProfile(id: string | undefined) {
  return useQuery({
    queryKey: [...USER_PROFILE_QUERY_KEY, id],
    queryFn: () => getPublicProfile(id!),
    enabled: typeof id === 'string' && id.length > 0,
  });
}

function patchProfileCache(
  queryClient: ReturnType<typeof useQueryClient>,
  id: string,
  result: FollowActionResult,
) {
  queryClient.setQueryData<PublicUserProfile>(
    [...USER_PROFILE_QUERY_KEY, id],
    (prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        followerCount: result.followerCount,
        followingCount: result.followingCount,
        isFollowing: result.isFollowing,
        isFollowedBy: result.isFollowedBy,
        isMutual: result.isMutual,
      };
    },
  );
}

export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => followUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [...USER_PROFILE_QUERY_KEY, id],
      });
      const previous = queryClient.getQueryData<PublicUserProfile>([
        ...USER_PROFILE_QUERY_KEY,
        id,
      ]);
      if (previous && !previous.isFollowing) {
        queryClient.setQueryData<PublicUserProfile>(
          [...USER_PROFILE_QUERY_KEY, id],
          {
            ...previous,
            isFollowing: true,
            followerCount: previous.followerCount + 1,
            isMutual: previous.isFollowedBy,
          },
        );
      }
      return { previous };
    },
    onError: (_error, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [...USER_PROFILE_QUERY_KEY, id],
          context.previous,
        );
      }
    },
    onSuccess: (result, id) => {
      patchProfileCache(queryClient, id, result);
    },
  });
}

export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unfollowUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [...USER_PROFILE_QUERY_KEY, id],
      });
      const previous = queryClient.getQueryData<PublicUserProfile>([
        ...USER_PROFILE_QUERY_KEY,
        id,
      ]);
      if (previous && previous.isFollowing) {
        queryClient.setQueryData<PublicUserProfile>(
          [...USER_PROFILE_QUERY_KEY, id],
          {
            ...previous,
            isFollowing: false,
            followerCount: Math.max(0, previous.followerCount - 1),
            isMutual: false,
          },
        );
      }
      return { previous };
    },
    onError: (_error, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          [...USER_PROFILE_QUERY_KEY, id],
          context.previous,
        );
      }
    },
    onSuccess: (result, id) => {
      patchProfileCache(queryClient, id, result);
    },
  });
}
