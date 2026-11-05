import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

/** End-of-list / empty reassurance card. */
export function NotificationsCaughtUpCard() {
  return (
    <View className="mx-5 items-center gap-3 rounded-3xl bg-surface-container px-6 py-8">
      <View className="h-14 w-14 items-center justify-center rounded-full bg-surface-container-highest">
        <Bell size={24} color="#CBC3D7" strokeWidth={2} />
      </View>
      <Text variant="title-md" className="text-center text-on-surface">
        {"You're all caught up"}
      </Text>
      <Text variant="body-md" className="text-center text-on-surface-variant">
        {
          "When people interact with your recordings, collaborate on stems, or view your profile, you'll see it here."
        }
      </Text>
    </View>
  );
}
