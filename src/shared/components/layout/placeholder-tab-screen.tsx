import { View } from 'react-native';

import { AppHeader } from '@/shared/components/layout/app-header';
import { Text } from '@/shared/components/ui/text';

type PlaceholderTabScreenProps = {
  title: string;
};

export function PlaceholderTabScreen({ title }: PlaceholderTabScreenProps) {
  return (
    <View className="flex-1 bg-background">
      <AppHeader />
      <View className="flex-1 items-center justify-center px-6">
        <Text variant="headline-lg-mobile" className="text-on-surface">
          {title}
        </Text>
      </View>
    </View>
  );
}
