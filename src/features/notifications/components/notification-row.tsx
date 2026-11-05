import { Image } from 'expo-image';
import {
  AudioLines,
  Heart,
  MessageCircle,
  MessageSquare,
  UserPlus,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { AppNotification, NotificationActionKind } from '../types';

const ACCENT = '#D0BCFF';
const MUTED = '#CBC3D7';
const BADGE_BG: Record<NotificationActionKind, string> = {
  like: '#E91E8C',
  follow: '#7C5CFF',
  comment: '#3B82F6',
  collab: '#14B8A6',
  message: '#3B82F6',
  remix: '#D0BCFF',
};

function ActionBadgeIcon({ kind }: { kind: NotificationActionKind }) {
  const color = '#FFFFFF';
  if (kind === 'like') return <Heart size={10} color={color} fill={color} />;
  if (kind === 'follow') return <UserPlus size={10} color={color} strokeWidth={2.4} />;
  if (kind === 'comment' || kind === 'message') {
    return <MessageCircle size={10} color={color} strokeWidth={2.4} />;
  }
  return <AudioLines size={10} color={color} strokeWidth={2.4} />;
}

type NotificationRowProps = {
  notification: AppNotification;
  onPress?: (notification: AppNotification) => void;
};

export function NotificationRow({ notification, onPress }: NotificationRowProps) {
  const trailing = notification.trailing;

  return (
    <Pressable
      onPress={() => onPress?.(notification)}
      accessibilityRole="button"
      accessibilityLabel={`${notification.actorName} ${notification.actionText}${
        notification.highlightText ? ` ${notification.highlightText}` : ''
      }`}
      className="flex-row items-center gap-3 px-5 py-3.5"
      style={({ pressed }) => ({
        opacity: pressed ? 0.88 : 1,
        backgroundColor: notification.unread ? 'rgba(208,188,255,0.04)' : 'transparent',
      })}>
      <View className="relative">
        <View className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-highest">
          <Image
            source={{ uri: notification.actorAvatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${notification.id}-avatar`}
          />
        </View>
        <View
          className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-background"
          style={{ backgroundColor: BADGE_BG[notification.actionKind] }}>
          <ActionBadgeIcon kind={notification.actionKind} />
        </View>
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-sans text-[14px] leading-5 text-on-surface" numberOfLines={2}>
          <Text className="font-semibold text-on-surface">{notification.actorName}</Text>
          <Text className="font-normal text-on-surface-variant">
            {' '}
            {notification.actionText}
            {notification.highlightText ? ' ' : ''}
          </Text>
          {notification.highlightText ? (
            <Text className="font-semibold" style={{ color: ACCENT }}>
              {notification.highlightText}
            </Text>
          ) : null}
        </Text>
        <Text
          className="font-sans text-[12px] font-normal leading-4"
          style={{ color: MUTED }}
          numberOfLines={1}>
          {notification.timeLabel} · {notification.metaLabel}
        </Text>
      </View>

      {trailing?.type === 'thumbnail' ? (
        <View
          className="h-12 w-12 overflow-hidden rounded-md bg-surface-container-highest"
          style={{ borderCurve: 'continuous' }}>
          <Image
            source={{ uri: trailing.url }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${notification.id}-thumb`}
          />
        </View>
      ) : null}

      {trailing?.type === 'icon' ? (
        <View className="h-12 w-12 items-center justify-center rounded-xl bg-surface-container">
          {trailing.icon === 'message' ? (
            <MessageSquare size={18} color={MUTED} strokeWidth={2} />
          ) : null}
          {trailing.icon === 'comment' ? (
            <MessageCircle size={18} color={MUTED} strokeWidth={2} />
          ) : null}
          {trailing.icon === 'waveform' ? (
            <AudioLines size={18} color={MUTED} strokeWidth={2} />
          ) : null}
        </View>
      ) : null}

      {notification.unread ? (
        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: ACCENT }} />
      ) : (
        <View className="h-2 w-2" />
      )}
    </Pressable>
  );
}
