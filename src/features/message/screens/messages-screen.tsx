import { type Href, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { useConversations, useMessageRequests } from '../api/hooks';
import { mapConversationPreview } from '../api/mappers';
import { ConversationRow } from '../components/conversation-row';
import { MessageBrandHeader } from '../components/message-brand-header';
import { MessageSearchBar } from '../components/message-search-bar';
import { MessageSegmentTabs } from '../components/message-segment-tabs';
import { useMessageStore } from '../store/message.store';

const ACCENT = '#D0BCFF';

export function MessagesScreen() {
  const { push } = useRouter();
  const searchQuery = useMessageStore((s) => s.searchQuery);
  const setSearchQuery = useMessageStore((s) => s.setSearchQuery);

  const conversationsQuery = useConversations();
  const requestsQuery = useMessageRequests();

  const conversations = (conversationsQuery.data ?? []).map(
    mapConversationPreview,
  );
  const requestCount = requestsQuery.data?.length ?? 0;

  const query = searchQuery.trim().toLowerCase();
  const filtered =
    query.length === 0
      ? conversations
      : conversations.filter((c) => {
          const haystack =
            `${c.participant.name} ${c.participant.handle} ${c.previewText}`.toLowerCase();
          return haystack.includes(query);
        });

  const openConversation = (id: string) => {
    push(`/message/${id}` as Href);
  };

  const openRequests = () => {
    push('/(tabs)/chat/requests' as Href);
  };

  const openProfile = () => {
    push('/(tabs)/profile' as Href);
  };

  return (
    <View className="flex-1 bg-background">
      <MessageBrandHeader onAvatarPress={openProfile} />

      <View className="gap-4 pb-2 pt-3">
        <Text variant="headline-lg-mobile" className="px-4 text-on-surface">
          Chat
        </Text>
        <MessageSearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <MessageSegmentTabs
          active="messages"
          requestCount={requestCount}
          onChange={(segment) => {
            if (segment === 'requests') openRequests();
          }}
        />
      </View>

      {conversationsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : conversationsQuery.isError ? (
        <View className="items-center gap-2 px-8 pt-16">
          <Text variant="title-md" className="text-on-surface">
            Couldn’t load conversations
          </Text>
          <Text
            variant="body-md"
            className="text-center text-primary-tonal"
            onPress={() => void conversationsQuery.refetch()}>
            Tap to retry
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow conversation={item} onPress={openConversation} />
          )}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
          ListEmptyComponent={<EmptySearch query={searchQuery} />}
        />
      )}
    </View>
  );
}

function EmptySearch({ query }: { query: string }) {
  return (
    <View className="items-center gap-2 px-8 pt-16">
      <Text variant="title-md" className="text-on-surface">
        No conversations found
      </Text>
      <Text variant="body-md" className="text-center text-on-surface-variant">
        {query.trim().length > 0
          ? `Nothing matches “${query.trim()}”.`
          : 'Your inbox is empty for now.'}
      </Text>
    </View>
  );
}
