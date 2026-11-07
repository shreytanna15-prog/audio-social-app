import { apiRequest } from '@/core/api';

import type {
  CommentLikeResponse,
  CommentSort,
  CreateCommentRequest,
  DeleteCommentResponse,
  TrackCommentDto,
} from './types';

export async function listTrackComments(
  trackId: string,
  sort: CommentSort = 'newest',
): Promise<TrackCommentDto[]> {
  return apiRequest<TrackCommentDto[]>({
    path: `/api/tracks/${trackId}/comments?sort=${sort}`,
    method: 'GET',
  });
}

export async function createTrackComment(
  trackId: string,
  body: CreateCommentRequest,
): Promise<TrackCommentDto> {
  return apiRequest<TrackCommentDto>({
    path: `/api/tracks/${trackId}/comments`,
    method: 'POST',
    body,
  });
}

export async function deleteComment(
  commentId: string,
): Promise<DeleteCommentResponse> {
  return apiRequest<DeleteCommentResponse>({
    path: `/api/comments/${commentId}`,
    method: 'DELETE',
  });
}

export async function likeComment(
  commentId: string,
): Promise<CommentLikeResponse> {
  return apiRequest<CommentLikeResponse>({
    path: `/api/comments/${commentId}/like`,
    method: 'POST',
  });
}

export async function unlikeComment(
  commentId: string,
): Promise<CommentLikeResponse> {
  return apiRequest<CommentLikeResponse>({
    path: `/api/comments/${commentId}/like`,
    method: 'DELETE',
  });
}
