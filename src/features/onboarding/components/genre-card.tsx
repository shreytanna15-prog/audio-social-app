import { Pressable, View } from 'react-native';

import { cn } from '@/shared/lib/utils';
import { Text } from '@/shared/components/ui/text';

import type { Genre } from '../data/genres';
import { OnboardingIcon } from './onboarding-icon';

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
        'relative h-36 overflow-hidden rounded-md p-4',
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
            backgroundColor: selected ? accent : 'rgba(149, 142, 160, 0.12)',
          }}>
          <OnboardingIcon
            name={selected ? 'check' : 'music'}
            size={selected ? 17 : 18}
            color={selected ? '#3C0091' : '#958EA0'}
          />
        </View>
        <View className={cn('rounded-full px-2.5 py-1', selected ? 'bg-white/10' : 'bg-surface-container')}>
          <Text variant="mono-metric" style={{ color: selected ? accent : '#958EA0' }}>
            {genre.tag}
          </Text>
        </View>
      </View>

      <View className="relative mt-auto pr-12">
        <Text variant="title-md" className="text-on-surface">
          {genre.name}
        </Text>
        <Text variant="caption" className="text-on-surface-variant">
          {genre.tagline}
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