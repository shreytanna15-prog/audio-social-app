import { Image } from 'expo-image';
import { Heart, Music2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { LibraryLikedTrackItem } from '../types';

const META = '#958EA0';
const HEART = '#D0BCFF';

type LibraryLikedTrackRowProps = {
  item: LibraryLikedTrackItem;
  onPress: (item: LibraryLikedTrackItem) => void;
  onUnlikePress: (item: LibraryLikedTrackItem) => void;
};

export function LibraryLikedTrackRow({
  item,
  onPress,
  onUnlikePress,
}: LibraryLikedTrackRowProps) {
  const meta = item.available ? item.artist : 'Unavailable';

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${meta}`}
      className="mx-4 flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3.5 py-3.5"
      style={{
        borderCurve: 'continuous',
        opacity: item.available ? 1 : 0.55,
      }}>
      <View
        className="h-11 w-11 items-center justify-center overflow-hidden rounded-xl"
        style={{
          backgroundColor: 'rgba(160, 120, 255, 0.16)',
          borderCurve: 'continuous',
        }}>
        {item.coverUrl ? (
          <Image
            source={{ uri: item.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={item.id}
            transition={160}
          />
        ) : (
          <Music2 size={20} color={HEART} strokeWidth={2} />
        )}
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="caption" style={{ color: META }} numberOfLines={1}>
          {meta}
        </Text>
      </View>

      <Pressable
        onPress={() => onUnlikePress(item)}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${item.title} from Liked Songs`}
        hitSlop={8}
        className="h-9 w-9 items-center justify-center">
        <Heart size={18} color={HEART} fill={HEART} strokeWidth={2} />
      </Pressable>
    </Pressable>
  );
}
