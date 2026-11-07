import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createTrackComment,
  deleteComment,
  likeComment,
  listTrackComments,
  unlikeComment,
} from './service';
import type {
  CommentSort,
  CreateCommentRequest,
  TrackCommentDto,
} from './types';

export const COMMENTS_QUERY_KEY = ['comments'] as const;

function patchComment(
  comments: TrackCommentDto[],
  commentId: string,
  patch: (comment: TrackCommentDto) => TrackCommentDto,
): TrackCommentDto[] {
  return comments.map((comment) => {
    const next = comment.id === commentId ? patch(comment) : comment;
    return next.replies
      ? { ...next, replies: patchComment(next.replies, commentId, patch) }
      : next;
  });
}

export function useTrackComments(
  trackId: string | undefined,
  sort: CommentSort = 'newest',
) {
  return useQuery({
    queryKey: [...COMMENTS_QUERY_KEY, trackId, sort],
    queryFn: () => listTrackComments(trackId!, sort),
    enabled: typeof trackId === 'string' && trackId.length > 0,
  });
}

export function useCreateTrackComment(trackId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateCommentRequest) =>
      createTrackComment(trackId!, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...COMMENTS_QUERY_KEY, trackId],
      });
    },
  });
}

export function useDeleteComment(trackId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...COMMENTS_QUERY_KEY, trackId],
      });
    },
  });
}

export function useToggleCommentLike(trackId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = [...COMMENTS_QUERY_KEY, trackId];

  return useMutation({
    mutationFn: (input: { commentId: string; liked: boolean }) =>
      input.liked ? likeComment(input.commentId) : unlikeComment(input.commentId),
    onMutate: async ({ commentId, liked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<TrackCommentDto[]>({
        queryKey,
      });

      queryClient.setQueriesData<TrackCommentDto[]>({ queryKey }, (data) =>
        data
          ? patchComment(data, commentId, (comment) => ({
              ...comment,
              isLiked: liked,
              likeCount: Math.max(0, comment.likeCount + (liked ? 1 : -1)),
            }))
          : data,
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });
}
