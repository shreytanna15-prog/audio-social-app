import { MoreVertical } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore } from '@/features/player';
import { ME_QUERY_KEY } from '@/features/profile/api/hooks';
import { getTrack } from '@/features/tracks';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useAppChromeNav } from '@/shared/lib/use-app-chrome-nav';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import {
  NOTIFICATIONS_QUERY_KEY,
  useNotifications,
} from '../api/hooks';
import { markNotificationsRead } from '../api/service';
import { NotificationRow } from '../components/notification-row';
import { NotificationsCaughtUpCard } from '../components/notifications-caught-up-card';
import { NotificationsSectionHeader } from '../components/notifications-section-header';
import type { AppNotification } from '../types';
import { mapNotificationItem } from '../utils/map-notification-item';

const ACCENT = '#D0BCFF';

export function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { openProfile } = useAppChromeNav();
  const { showError, dialog } = useFeedbackDialog();
  const queryClient = useQueryClient();
  const play = usePlayerStore((s) => s.play);

  const notificationsQuery = useNotifications(30);

  const notifications = useMemo(
    () =>
      (notificationsQuery.data?.pages ?? []).flatMap((page) =>
        page.items.map((item) => mapNotificationItem(item)),
      ),
    [notificationsQuery.data?.pages],
  );

  useFocusEffect(
    useCallback(() => {
      void markNotificationsRead({})
        .then(async () => {
          await queryClient.invalidateQueries({
            queryKey: NOTIFICATIONS_QUERY_KEY,
          });
          await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
        })
        .catch(() => undefined);
    }, [queryClient]),
  );

  const onEndReached = () => {
    if (
      notificationsQuery.hasNextPage &&
      !notificationsQuery.isFetchingNextPage
    ) {
      void notificationsQuery.fetchNextPage();
    }
  };

  const openNotification = (notification: AppNotification) => {
    if (notification.trackId) {
      guard(() => {
        void getTrack(notification.trackId!)
          .then((track) => {
            play({
              id: track.id,
              title: track.title,
              artist: notification.actorName,
              coverUrl: track.coverUrl ?? '',
              mixUrl: track.mixUrl,
            });
            push('/player' as Href);
          })
          .catch(() => {
            if (notification.actorId) {
              push(`/artist/${notification.actorId}` as Href);
            }
          });
      });
      return;
    }
    if (notification.actorId) {
      guard(() => push(`/artist/${notification.actorId}` as Href));
    }
  };

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
              onPress={openProfile}
              className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-primary-container/30">
              <Text variant="label-sm" className="font-semibold text-on-surface">
                U
              </Text>
            </Pressable>
          </View>
        }
      />

      {notificationsQuery.isLoading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : notificationsQuery.isError && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Couldn’t load notifications.
          </Text>
          <Pressable
            onPress={() => void notificationsQuery.refetch()}
            accessibilityRole="button"
            hitSlop={8}>
            <Text variant="label-md" className="font-semibold text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            flexGrow: 1,
          }}
          ListHeaderComponent={<NotificationsSectionHeader />}
          ListFooterComponent={
            <View className="mt-4">
              <NotificationsCaughtUpCard />
            </View>
          }
          ListEmptyComponent={
            <View className="items-center gap-2 px-8 pt-16">
              <Text variant="title-md" className="text-on-surface">
                You’re all caught up
              </Text>
              <Text
                variant="body-md"
                className="text-center text-on-surface-variant">
                Follows, likes, and comments will show up here.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onPress={openNotification}
            />
          )}
        />
      )}
      {dialog}
    </View>
  );
}

export default NotificationsScreen;
