import { apiRequest } from '@/core/api';

import type { FeedPageDto } from './types';

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
