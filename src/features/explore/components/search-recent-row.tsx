import { Image } from 'expo-image';
import {
  AudioLines,
  Disc3,
  ListMusic,
  Music2,
  User,
  X,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { SearchRecentItem, SearchRecentKind } from '@/features/users';
import { Text } from '@/shared/components/ui/text';

const ICON_REMOVE = '#958EA0';
const TITLE = '#E4E1EA';
const SUBTITLE = '#958EA0';

type SearchRecentRowProps = {
  item: SearchRecentItem;
  onPress: () => void;
  onRemove?: () => void;
};

function initialFrom(title: string | null, fallback: string): string {
  const source = (title?.trim() || fallback).trim();
  return source.charAt(0).toUpperCase() || '?';
}

function KindGlyph({ kind }: { kind: SearchRecentKind }) {
  if (kind === 'ARTIST') {
    return <User size={13} color="#CCBEFF" strokeWidth={2} />;
  }
  if (kind === 'SONG') {
    return <Music2 size={13} color="#D0BCFF" strokeWidth={2} />;
  }
  if (kind === 'ALBUM') {
    return <Disc3 size={13} color="#FFB0CD" strokeWidth={2} />;
  }
  if (kind === 'PLAYLIST') {
    return <ListMusic size={13} color="#CCBEFF" strokeWidth={2} />;
  }
  return <AudioLines size={13} color="#D0BCFF" strokeWidth={2} />;
}

function defaultSubtitle(item: SearchRecentItem): string {
  if (item.kind === 'ARTIST') return 'Artist';
  if (item.kind === 'SONG') {
    return item.subtitle?.includes('•')
      ? item.subtitle
      : `${item.subtitle?.trim() || 'Unknown'} • Song`;
  }
  return item.kind;
}

/**
 * Figma Recent row: 48 thumb (circle artist / 12r media), title 16/semibold,
 * kind icon + muted subtitle, trailing clear X — no card chrome.
 */
export function SearchRecentRow({
  item,
  onPress,
  onRemove,
}: SearchRecentRowProps) {
  const isArtist = item.kind === 'ARTIST';
  const title =
    item.title?.trim() ||
    (isArtist && item.targetUser
      ? item.targetUser.name?.trim() || `@${item.targetUser.username}`
      : 'Untitled');
  const subtitle = item.subtitle?.trim() || defaultSubtitle(item);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-90">
      {item.coverUrl ? (
        <View
          className={
            isArtist
              ? 'h-12 w-12 overflow-hidden rounded-full bg-surface-container-high'
              : 'h-12 w-12 overflow-hidden rounded-xl bg-surface-container-high'
          }
          style={
            isArtist
              ? undefined
              : { borderCurve: 'continuous' }
          }>
          <Image
            source={{ uri: item.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={item.id}
          />
        </View>
      ) : isArtist ? (
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tonal">
          <Text variant="title-md" className="text-on-primary">
            {initialFrom(
              item.targetUser?.name ?? null,
              item.targetUser?.username ?? title,
            )}
          </Text>
        </View>
      ) : (
        <View
          className="h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high"
          style={{ borderCurve: 'continuous' }}>
          <KindGlyph kind={item.kind} />
        </View>
      )}

      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          variant="title-md"
          style={{ color: TITLE }}
          numberOfLines={1}>
          {title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <KindGlyph kind={item.kind} />
          <Text
            variant="label-md"
            className="shrink font-normal"
            style={{ color: SUBTITLE }}
            numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      {onRemove ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            onRemove();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${title} from recent`}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center">
          <X size={18} color={ICON_REMOVE} strokeWidth={2} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
