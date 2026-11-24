import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { getHomeGreetingParts } from '../utils/greeting';

type HomeGreetingRowProps = {
  name?: string;
};

export function HomeGreetingRow({ name = 'there' }: HomeGreetingRowProps) {
  const { phrase, name: displayName } = getHomeGreetingParts(name);

  return (
    <View className="mb-2 gap-2.5 px-4 pb-2 pt-0">
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

      <View className="h-0.5 w-8 rounded-full bg-primary/35" />
    </View>
  );
}
