import { apiRequest } from '@/core/api';

import type {
  MarkNotificationsReadBody,
  MarkReadResultDto,
  NotificationPageDto,
  UnreadCountDto,
} from './types';

export async function getNotifications(params?: {
  cursor?: string;
  limit?: number;
}): Promise<NotificationPageDto> {
  const search = new URLSearchParams();
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.limit != null) search.set('limit', String(params.limit));
  const query = search.toString();

  return apiRequest<NotificationPageDto>({
    path: query ? `/api/notifications?${query}` : '/api/notifications',
    method: 'GET',
  });
}

export async function getUnreadNotificationCount(): Promise<UnreadCountDto> {
  return apiRequest<UnreadCountDto>({
    path: '/api/notifications/unread-count',
    method: 'GET',
  });
}

export async function markNotificationsRead(
  body: MarkNotificationsReadBody = {},
): Promise<MarkReadResultDto> {
  return apiRequest<MarkReadResultDto>({
    path: '/api/notifications/read',
    method: 'POST',
    body,
  });
}
