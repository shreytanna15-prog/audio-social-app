import { MoreVertical } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { NotificationRow } from '../components/notification-row';
import { NotificationsCaughtUpCard } from '../components/notifications-caught-up-card';
import { NotificationsSectionHeader } from '../components/notifications-section-header';
import { NOTIFICATIONS } from '../data/notifications.fixtures';

/**
 * Notifications inbox — fixture-backed until the notifications API lands.
 */
export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { showError, dialog } = useFeedbackDialog();

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        title="Notifications"
        right={
          <View className="flex-row items-center gap-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="More options"
              hitSlop={8}
              onPress={() =>
                showError('Notifications', 'Notification settings coming soon.')
              }
              className="h-10 w-10 items-center justify-center rounded-full active:bg-surface-bright">
              <MoreVertical size={20} color="#E4E1EA" strokeWidth={2} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              hitSlop={4}
              onPress={() => guard(() => push('/(tabs)/profile' as Href))}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-primary-container/30">
              <Text variant="label-sm" className="font-semibold text-on-surface">
                U
              </Text>
            </Pressable>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-2 pb-10"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 24,
        }}
        showsVerticalScrollIndicator={false}>
        <NotificationsSectionHeader />

        <View>
          {NOTIFICATIONS.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} />
          ))}
        </View>

        <View className="mt-4">
          <NotificationsCaughtUpCard />
        </View>
      </ScrollView>
      {dialog}
    </View>
  );
}

export default NotificationsScreen;
