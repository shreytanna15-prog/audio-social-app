import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { TRACKS_QUERY_KEY } from '@/features/tracks/api/hooks';

import {
  createFeedClip,
  createFeedClipUploadUrl,
  deleteFeedClip,
  getFeed,
  getFeedClipForTrack,
  likeFeedClip,
  unlikeFeedClip,
  uploadFeedClipToSignedUrl,
} from './service';
import type { CreateFeedClipRequest } from './types';

export const FEED_QUERY_KEY = ['feed'] as const;
export const FEED_CLIP_FOR_TRACK_KEY = ['feed', 'clip-for-track'] as const;

async function invalidateFeedAndTracks(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: TRACKS_QUERY_KEY }),
  ]);
}

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

export function useFeedClipForTrack(trackId: string | undefined) {
  return useQuery({
    queryKey: [...FEED_CLIP_FOR_TRACK_KEY, trackId],
    queryFn: () => getFeedClipForTrack(trackId!),
    enabled: Boolean(trackId),
  });
}

export function useLikeFeedClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => likeFeedClip(clipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
    },
  });
}

export function useUnlikeFeedClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => unlikeFeedClip(clipId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEY });
    },
  });
}

export function useDeleteFeedClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => deleteFeedClip(clipId),
    onSuccess: async () => {
      await invalidateFeedAndTracks(queryClient);
    },
  });
}

export function useCreateFeedClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      trackId: string;
      localClipUri: string;
      startMs: number;
      endMs: number;
      durationMs: number;
    }) => {
      const upload = await createFeedClipUploadUrl(input.trackId);
      await uploadFeedClipToSignedUrl(upload.signedUrl, input.localClipUri);
      const body: CreateFeedClipRequest = {
        trackId: input.trackId,
        clipAudioPath: upload.path,
        startMs: input.startMs,
        endMs: input.endMs,
        durationMs: input.durationMs,
      };
      return createFeedClip(body);
    },
    onSuccess: async () => {
      await invalidateFeedAndTracks(queryClient);
    },
  });
}
