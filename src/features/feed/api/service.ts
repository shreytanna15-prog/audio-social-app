import { apiRequest } from '@/core/api';

import type {
  CreateFeedClipRequest,
  FeedClipLikeResultDto,
  FeedClipSummaryDto,
  FeedClipUploadUrlDto,
  FeedPageDto,
} from './types';

export async function getFeed(params?: {
  cursor?: string;
  limit?: number;
}): Promise<FeedPageDto> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();

  return apiRequest<FeedPageDto>({
    path: query ? `/api/feed?${query}` : '/api/feed',
    method: 'GET',
  });
}

export async function createFeedClipUploadUrl(
  trackId: string,
): Promise<FeedClipUploadUrlDto> {
  return apiRequest<FeedClipUploadUrlDto>({
    path: '/api/feed/clips/upload-url',
    method: 'POST',
    body: { trackId },
  });
}

export async function uploadFeedClipToSignedUrl(
  signedUrl: string,
  localUri: string,
): Promise<void> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'audio/mp4',
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status}). Try again.`);
  }
}

export async function createFeedClip(
  body: CreateFeedClipRequest,
): Promise<FeedClipSummaryDto> {
  return apiRequest<FeedClipSummaryDto>({
    path: '/api/feed/clips',
    method: 'POST',
    body,
  });
}

export async function getFeedClipForTrack(
  trackId: string,
): Promise<FeedClipSummaryDto | null> {
  return apiRequest<FeedClipSummaryDto | null>({
    path: `/api/feed/clips/for-track/${trackId}`,
    method: 'GET',
  });
}

export async function deleteFeedClip(clipId: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>({
    path: `/api/feed/clips/${clipId}`,
    method: 'DELETE',
  });
}

export async function likeFeedClip(
  clipId: string,
): Promise<FeedClipLikeResultDto> {
  return apiRequest<FeedClipLikeResultDto>({
    path: `/api/feed/clips/${clipId}/like`,
    method: 'POST',
  });
}

export async function unlikeFeedClip(
  clipId: string,
): Promise<FeedClipLikeResultDto> {
  return apiRequest<FeedClipLikeResultDto>({
    path: `/api/feed/clips/${clipId}/like`,
    method: 'DELETE',
  });
}
