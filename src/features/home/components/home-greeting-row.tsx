import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { getHomeGreetingParts } from '../utils/greeting';

type HomeGreetingRowProps = {
  name?: string;
};

export function HomeGreetingRow({ name = 'there' }: HomeGreetingRowProps) {
  const { phrase, name: displayName } = getHomeGreetingParts(name);

  return (
    <View className="relative mb-2 overflow-hidden px-4 pb-3 pt-0">
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          experimental_backgroundImage:
            'linear-gradient(to bottom, rgba(160, 120, 255, 0.14) 0%, rgba(208, 188, 255, 0.06) 45%, rgba(208, 188, 255, 0) 100%)',
        }}
      />

      <View className="gap-3">
        <View className="gap-1">
          <Text
            variant="title-lg"
            className="font-medium text-on-surface-variant"
            numberOfLines={2}>
            {phrase}
          </Text>
          <Text
            variant="display-hero-mobile"
            className="text-on-surface"
            numberOfLines={1}>
            {displayName}
          </Text>
        </View>

        <View className="h-px w-full flex-row items-center overflow-hidden">
          <View
            className="h-0.5 w-10 rounded-full"
            style={{ backgroundColor: '#D0BCFF' }}
          />
          <View
            className="h-px flex-1"
            style={{
              experimental_backgroundImage:
                'linear-gradient(to right, rgba(208, 188, 255, 0.55) 0%, rgba(255, 255, 255, 0.10) 28%, rgba(255, 255, 255, 0.04) 70%, rgba(255, 255, 255, 0) 100%)',
            }}
          />
        </View>
      </View>
    </View>
  );
}
