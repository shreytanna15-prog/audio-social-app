import { Image } from 'expo-image';
import { Music2, MoreVertical } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

/**
 * Shared Library 2-col cover cell — same bones as ProfileAlbumGrid
 * (flex-1 column cell, aspect-square, rounded-2xl artwork) with Library chrome.
 */
type LibraryCoverCardProps = {
  id: string;
  title: string;
  coverUrl: string | null;
  accessibilityLabel: string;
  meta: ReactNode;
  onPress: () => void;
  onMorePress: () => void;
};

export function LibraryCoverCard({
  id,
  title,
  coverUrl,
  accessibilityLabel,
  meta,
  onPress,
  onMorePress,
}: LibraryCoverCardProps) {
  return (
    // Half-width cell — avoid flex-1 alone (odd last row stretches full width).
    <View className="w-1/2 gap-2.5 px-1.5">
      <View
        className="relative aspect-square overflow-hidden rounded-2xl bg-surface-container"
        style={{ borderCurve: 'continuous' }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          className="absolute inset-0"
          style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}>
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={id}
              transition={160}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Music2 size={36} color="#958EA0" strokeWidth={1.8} />
            </View>
          )}
          <View
            pointerEvents="none"
            className="absolute inset-0"
            style={{
              experimental_backgroundImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 42%)',
            }}
          />
        </Pressable>

        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${title}`}
          hitSlop={6}
          className="absolute right-2 top-2 z-10 h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(19, 19, 25, 0.55)' }}>
          <MoreVertical size={16} color="#E4E1EA" strokeWidth={2.2} />
        </Pressable>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className="gap-1 px-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {title}
        </Text>
        {meta}
      </Pressable>
    </View>
  );
}
