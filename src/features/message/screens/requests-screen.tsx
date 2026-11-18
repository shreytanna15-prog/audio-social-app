import { type Href, useRouter } from 'expo-router';
import { ArrowLeft, Shield } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import {
  useAcceptConversation,
  useDeclineConversation,
  useMessageRequests,
} from '../api/hooks';
import { mapMessageRequest } from '../api/mappers';
import { MessageBrandHeader } from '../components/message-brand-header';
import { RequestCard } from '../components/request-card';
import { RequestCountBadge } from '../components/request-count-badge';
import { RequestInfoBanner } from '../components/request-info-banner';

const ACCENT = '#D0BCFF';

export function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, replace, push } = useRouter();
  const { guard } = useNavigationGuard();
  const requestsQuery = useMessageRequests();
  const accept = useAcceptConversation();
  const decline = useDeclineConversation();

  const requests = (requestsQuery.data ?? []).map(mapMessageRequest);

  const handleBack = () => {
    if (canGoBack()) {
      guard(() => back());
      return;
    }
    guard(() => replace('/(tabs)/chat/' as Href));
  };

  const handleAccept = (id: string) => {
    accept.mutate(id, {
      onSuccess: (conversation) => {
        guard(() => push(`/message/${conversation.id}` as Href));
      },
    });
  };

  const handleDecline = (id: string) => {
    decline.mutate(id);
  };

  return (
    <View className="flex-1 bg-background">
      <MessageBrandHeader onAvatarPress={() => guard(() => push('/(tabs)/profile' as Href))} />

      <View className="flex-row items-center gap-2 px-3 pb-3 pt-2">
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-white/5">
          <ArrowLeft size={22} color="#E4E1EA" strokeWidth={2} />
        </Pressable>

        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Text variant="headline-lg-mobile" className="text-on-surface">
            Requests
          </Text>
          <RequestCountBadge count={requests.length} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Safety settings"
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-white/5">
          <Shield size={20} color="#E4E1EA" strokeWidth={1.9} />
        </Pressable>
      </View>

      {requestsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : requestsQuery.isError ? (
        <View className="items-center gap-2 px-8 pt-16">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load requests
          </Text>
          <Text
            variant="body-md"
            className="text-center text-primary-tonal"
            onPress={() => void requestsQuery.refetch()}>
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View className="gap-4 pb-2">
              <RequestInfoBanner />
            </View>
          }
          renderItem={({ item }) => (
            <View className="pb-3">
              <RequestCard
                request={item}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            </View>
          )}
          ListFooterComponent={
            requests.length > 0 ? (
              <View className="items-center gap-1.5 px-8 pb-4 pt-4">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                  <Text variant="body-md" className="text-on-surface-variant">
                    You have {requests.length} pending request
                    {requests.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text
                  variant="caption"
                  className="text-center text-on-surface-variant/80">
                  Filtered according to your collaborative artist preferences.
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center gap-2 px-8 pt-16">
              <Text variant="title-md" className="text-on-surface">
                No pending requests
              </Text>
              <Text
                variant="body-md"
                className="text-center text-on-surface-variant">
                New message requests will show up here.
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            flexGrow: 1,
            gap: 4,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}
