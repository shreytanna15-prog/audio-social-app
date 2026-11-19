import { SlidersHorizontal } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { getHomeGreeting } from '../utils/greeting';

type HomeGreetingRowProps = {
  name?: string;
  onFilterPress?: () => void;
};

export function HomeGreetingRow({ name = 'there', onFilterPress }: HomeGreetingRowProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-4">
      <Text
        variant="headline-lg-mobile"
        className="flex-1 text-on-surface"
        numberOfLines={1}>
        {getHomeGreeting(name)}
      </Text>

      <Pressable
        onPress={onFilterPress}
        accessibilityRole="button"
        accessibilityLabel="Filter"
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-surface-container">
        <SlidersHorizontal size={18} color="#E4E1EA" strokeWidth={2} />
      </Pressable>
    </View>
  );
}
