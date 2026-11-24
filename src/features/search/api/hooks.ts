import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clearSearchRecent,
  listSearchRecent,
  recordSearchRecent,
  removeSearchRecent,
  searchMusic,
} from './service';
import type {
  RecordSearchRecentRequest,
  SearchRecentItem,
} from './types';

export const SEARCH_RECENT_QUERY_KEY = ['search', 'recent'] as const;
export const MUSIC_SEARCH_QUERY_KEY = ['search', 'music'] as const;

export function useSearchMusic(q: string, enabled = true) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: [...MUSIC_SEARCH_QUERY_KEY, trimmed],
    queryFn: () => searchMusic(trimmed),
    enabled: enabled && trimmed.length > 0,
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
