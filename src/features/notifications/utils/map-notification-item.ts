import { formatConversationTime } from '@/features/message/utils/format-message-time';

import type { NotificationItemDto } from '../api/types';
import type { AppNotification, NotificationActionKind } from '../types';

function actorDisplayName(actor: {
  name: string | null;
  username: string;
}): string {
  return actor.name?.trim() || actor.username;
}

function actionCopy(type: NotificationItemDto['type']): {
  actionKind: NotificationActionKind;
  actionText: string;
  metaLabel: string;
} {
  switch (type) {
    case 'FOLLOW':
      return {
        actionKind: 'follow',
        actionText: 'started following you',
        metaLabel: 'Follow',
      };
    case 'LIKE':
      return {
        actionKind: 'like',
        actionText: 'liked your track',
        metaLabel: 'Like',
      };
    case 'COMMENT':
      return {
        actionKind: 'comment',
        actionText: 'commented on',
        metaLabel: 'Comment',
      };
  }
}

export function mapNotificationItem(
  dto: NotificationItemDto,
  nowMs: number = Date.now(),
): AppNotification {
  const copy = actionCopy(dto.type);
  const highlightText =
    dto.type === 'FOLLOW' ? undefined : (dto.track?.title ?? undefined);

  return {
    id: dto.id,
    actorName: actorDisplayName(dto.actor),
    actorAvatarUrl: dto.actor.avatarUrl ?? '',
    actionKind: copy.actionKind,
    actionText: copy.actionText,
    highlightText,
    timeLabel: formatConversationTime(dto.createdAt, nowMs),
    metaLabel: copy.metaLabel,
    unread: dto.readAt == null,
    trailing:
      dto.track?.coverUrl != null && dto.track.coverUrl.length > 0
        ? { type: 'thumbnail', url: dto.track.coverUrl }
        : dto.type === 'FOLLOW'
          ? { type: 'icon', icon: 'message' }
          : undefined,
    actorId: dto.actor.id,
    trackId: dto.track?.id,
  };
}
