import type { AppNotification } from '../types';

/**
 * Development fixtures — swap for notifications API when available.
 */
export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    actorName: 'Kaelen Voss',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'like',
    actionText: 'liked your cover',
    highlightText: 'Midnight Groove',
    timeLabel: '2m ago',
    metaLabel: 'Cover Session',
    unread: true,
    trailing: {
      type: 'thumbnail',
      url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop',
    },
  },
  {
    id: 'n2',
    actorName: 'Luna Reed',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'follow',
    actionText: 'started following you',
    timeLabel: 'Yesterday',
    metaLabel: 'Producer · Mumbai',
    unread: true,
    trailing: { type: 'icon', icon: 'message' },
  },
  {
    id: 'n3',
    actorName: 'SOMA Waves',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1516280440612-4805766bf1d4?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'comment',
    actionText: 'commented on',
    highlightText: 'Velvet Rain',
    timeLabel: '3h ago',
    metaLabel: 'Stem Mix',
    unread: true,
    trailing: { type: 'icon', icon: 'comment' },
  },
  {
    id: 'n4',
    actorName: 'Nova Blake',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'collab',
    actionText: 'invited you to collab on',
    highlightText: 'Astral Echoes',
    timeLabel: '5h ago',
    metaLabel: 'Multi-Track',
    unread: false,
    trailing: { type: 'icon', icon: 'waveform' },
  },
  {
    id: 'n5',
    actorName: 'Elara',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'remix',
    actionText: 'remixed your stem',
    highlightText: 'Luminous Drift',
    timeLabel: '1d ago',
    metaLabel: 'Remix Contest',
    unread: false,
    trailing: {
      type: 'thumbnail',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
    },
  },
  {
    id: 'n6',
    actorName: 'Maya Lin',
    actorAvatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994d69daeb?w=200&h=200&fit=crop&crop=faces',
    actionKind: 'like',
    actionText: 'liked your take',
    highlightText: 'Harmony Bridge',
    timeLabel: '2d ago',
    metaLabel: 'Quick Record',
    unread: false,
    trailing: {
      type: 'thumbnail',
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop',
    },
  },
];
