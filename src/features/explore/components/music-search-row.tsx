import { Image } from 'expo-image';
import { Disc3, ListMusic, Music2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import type { MusicSearchItem } from '@/features/users';
import { Text } from '@/shared/components/ui/text';

type Props = { item: MusicSearchItem; onPress: () => void };

export function MusicSearchRow({ item, onPress }: Props) {
  const label = item.type === 'song' ? 'Song' : item.type === 'album' ? 'Album' : 'Playlist';
  const Icon = item.type === 'song' ? Music2 : item.type === 'album' ? Disc3 : ListMusic;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${label.toLowerCase()} ${item.title}`}
      className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-90">
      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-surface-container-high">
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${item.type}-${item.id}`}
          />
        ) : (
          <Icon size={22} color="#D0BCFF" />
        )}
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="label-md" className="text-on-surface-variant" numberOfLines={1}>
          {label} · {item.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}
