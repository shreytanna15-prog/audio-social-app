import { Pressable, View } from 'react-native';
import { Music } from 'lucide-react-native';

import { cn } from '@/shared/lib/utils';
import { Text } from '@/shared/components/ui/text';

import type { Genre } from '../data/genres';

const accentColor = (genre: Genre) => (genre.accent === 'secondary' ? '#FFB0CD' : '#D0BCFF');

export function GenreCard({
  genre,
  selected,
  onPress,
}: {
  genre: Genre;
  selected: boolean;
  onPress: () => void;
}) {
  const accent = accentColor(genre);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={cn(
        'relative h-28 overflow-hidden rounded-md p-4',
        selected
          ? 'bg-surface-container-high'
          : 'bg-surface-container-low active:bg-surface-container',
      )}
      style={({ pressed }) => [
        selected && {
          shadowColor: accent,
          shadowOpacity: 0.18,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 5 },
          elevation: 5,
        },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}>
      <View className="relative flex-row items-start justify-between">
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(149, 142, 160, 0.12)',
            borderColor: selected ? accent : 'transparent',
            borderWidth: selected ? 1 : 0,
          }}>
          <Music size={18} color={selected ? accent : '#958EA0'} strokeWidth={2} />
        </View>
        {selected ? (
          <View className="rounded-full bg-white/10 px-2.5 py-1">
            <Text variant="mono-metric" style={{ color: accent }}>
              On
            </Text>
          </View>
        ) : null}
      </View>

      <View className="relative mt-auto pr-10">
        <Text variant="title-md" className="text-on-surface" numberOfLines={2}>
          {genre.name}
        </Text>
      </View>

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          height: 20,
          flexDirection: 'row',
          alignItems: 'flex-end',
          gap: 2,
          opacity: selected ? 0.9 : 0.35,
        }}>
        {[8, 16, 10, 6].map((height, index) => (
          <View
            key={index}
            style={{ width: 4, height, borderRadius: 2, backgroundColor: accent }}
          />
        ))}
      </View>
    </Pressable>
  );
}
