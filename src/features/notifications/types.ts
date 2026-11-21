export type NotificationActionKind =
  | 'like'
  | 'follow'
  | 'comment'
  | 'collab'
  | 'message'
  | 'remix';

export type NotificationTrailing =
  | { type: 'thumbnail'; url: string }
  | { type: 'icon'; icon: 'message' | 'comment' | 'waveform' };

export type AppNotification = {
  id: string;
  actorName: string;
  actorAvatarUrl: string;
  actionKind: NotificationActionKind;
  /** e.g. "liked your cover" — text after the actor name */
  actionText: string;
  /** Purple emphasis, e.g. track title */
  highlightText?: string;
  timeLabel: string;
  metaLabel: string;
  unread: boolean;
  trailing?: NotificationTrailing;
  actorId?: string;
  trackId?: string;
};
