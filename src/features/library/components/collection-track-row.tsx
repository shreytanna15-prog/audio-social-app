import { Image } from 'expo-image';
import { Music2, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

export type CollectionTrackRowItem = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl: string | null;
  available: boolean;
};

type CollectionTrackRowProps = {
  item: CollectionTrackRowItem;
  onPress: (item: CollectionTrackRowItem) => void;
  onMorePress?: (item: CollectionTrackRowItem) => void;
};

export function CollectionTrackRow({
  item,
  onPress,
  onMorePress,
}: CollectionTrackRowProps) {
  const { available } = item;

  return (
    <View className="flex-row items-center gap-3.5 rounded-2xl bg-surface-container px-4 py-3.5">
      <Pressable
        onPress={() => onPress(item)}
        disabled={!available}
        accessibilityRole="button"
        accessibilityState={{ disabled: !available }}
        accessibilityLabel={
          available ? `Play ${item.title}` : `${item.title}, unavailable`
        }
        className="min-w-0 flex-1 flex-row items-center gap-3.5"
        style={{ opacity: available ? 1 : 0.55 }}>
        <View
          className="h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-highest"
          style={{ borderCurve: 'continuous' }}>
          {item.coverUrl && available ? (
            <Image
              source={{ uri: item.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={item.id}
            />
          ) : (
            <Music2 size={20} color="#CBC3D7" strokeWidth={2} />
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <Text
            variant="title-md"
            className="text-on-surface"
            numberOfLines={1}>
            {item.title}
          </Text>
          <Text
            variant="caption"
            className="text-on-surface-variant"
            numberOfLines={1}>
            {available ? item.subtitle : 'Unavailable'}
          </Text>
        </View>
      </Pressable>

      {onMorePress ? (
        <Pressable
          onPress={() => onMorePress(item)}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${item.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <MoreVertical size={18} color="#958EA0" strokeWidth={2} />
        </Pressable>
      ) : null}
    </View>
  );
}
