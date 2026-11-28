import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';

import { useContestLeaderboard } from '../api/hooks';

export function ContestLeaderboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const query = useContestLeaderboard(id);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Leaderboard" />
      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : query.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Could not load leaderboard.
          </Text>
          <Pressable onPress={() => void query.refetch()}>
            <Text variant="title-md" className="text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            gap: 8,
          }}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text variant="body-md" className="text-on-surface-variant">
                No entries.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="flex-row items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-container px-3 py-3">
              <Text
                variant="title-md"
                className="w-8 text-center font-mono text-primary-tonal">
                {item.placeBand ?? '-'}
              </Text>
              <View className="min-w-0 flex-1 gap-0.5">
                <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
                  {item.trackTitle}
                </Text>
                <Text variant="label-sm" className="text-on-surface-variant">
                  @{item.username} · {item.voteCount} votes
                </Text>
              </View>
              {item.prizeCoins > 0 ? (
                <Text variant="label-sm" className="text-primary-tonal">
                  +{item.prizeCoins}
                </Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}
