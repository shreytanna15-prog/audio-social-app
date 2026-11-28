import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';

import { useContests } from '../api/hooks';
import { ContestCard } from '../components/contest-card';

const TABS = [
  { id: 'active' as const, label: 'Active' },
  { id: 'upcoming' as const, label: 'Upcoming' },
  { id: 'closed' as const, label: 'Closed' },
];

export function ContestsListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'upcoming' | 'active' | 'closed'>('active');
  const query = useContests(tab);

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Contests" />
      <View className="flex-row gap-2 px-4 pb-3">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setTab(item.id)}
              className={`rounded-full px-3 py-1.5 ${
                active ? 'bg-primary-tonal' : 'bg-surface-container-high'
              }`}>
              <Text
                variant="label-sm"
                className={active ? 'text-[#3C0091]' : 'text-on-surface-variant'}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : query.isError ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Could not load contests.
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
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            gap: 12,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching}
              onRefresh={() => void query.refetch()}
              tintColor="#D0BCFF"
            />
          }
          ListEmptyComponent={
            <View className="items-center px-6 py-16">
              <Text
                variant="body-md"
                className="text-center text-on-surface-variant">
                No contests in this tab yet.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ContestCard
              contest={item}
              onPress={() =>
                router.push(`/contests/${item.id}` as Href)
              }
            />
          )}
        />
      )}
    </View>
  );
}
