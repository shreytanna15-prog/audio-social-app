export type NotificationTypeDto = 'FOLLOW' | 'LIKE' | 'COMMENT';

export type NotificationActorDto = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type NotificationTrackDto = {
  id: string;
  title: string;
  coverUrl: string | null;
};

export type NotificationItemDto = {
  id: string;
  type: NotificationTypeDto;
  createdAt: string;
  readAt: string | null;
  actor: NotificationActorDto;
  track: NotificationTrackDto | null;
};

export type NotificationPageDto = {
  items: NotificationItemDto[];
  nextCursor: string | null;
};

export type UnreadCountDto = {
  count: number;
};

export type MarkNotificationsReadBody = {
  ids?: string[];
};

export type MarkReadResultDto = {
  markedCount: number;
};
