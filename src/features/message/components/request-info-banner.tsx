import { EyeOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

export function RequestInfoBanner() {
  return (
    <View className="mx-4 flex-row items-start gap-3 rounded-2xl bg-surface-container px-3.5 py-3.5">
      <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-surface-container-high">
        <EyeOff size={16} color="#CBC3D7" strokeWidth={2} />
      </View>
      <Text variant="body-md" className="min-w-0 flex-1 text-on-surface-variant">
        These people want to send you a message. They won&apos;t know you&apos;ve seen
        their request until you accept.
      </Text>
    </View>
  );
}
