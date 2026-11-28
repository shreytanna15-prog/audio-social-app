import { Award, Star } from 'lucide-react-native';
import { useMemo } from 'react';
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

import { useWallet } from '../api/hooks';
import type { CoinTransactionDto } from '../api/types';

const ACCENT = '#D0BCFF';
const coinFormatter = new Intl.NumberFormat('en-US');

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TransactionRow({ item }: { item: CoinTransactionDto }) {
  const Icon = item.type === 'CONTEST_REWARD' ? Award : Star;

  return (
    <View className="flex-row items-center gap-3 border-b border-outline-variant/20 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-surface-container-high">
        <Icon size={18} color={ACCENT} strokeWidth={1.8} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="body-md" className="text-on-surface" numberOfLines={2}>
          {item.description}
        </Text>
        <Text variant="label-sm" className="text-on-surface-variant">
          {formatRelativeDate(item.createdAt)}
        </Text>
      </View>
      <Text variant="title-md" className="text-primary-tonal">
        +{coinFormatter.format(item.amount)}
      </Text>
    </View>
  );
}

export function WalletScreen() {
  const insets = useSafeAreaInsets();
  const walletQuery = useWallet(20);

  const balance = walletQuery.data?.pages[0]?.balance ?? 0;
  const transactions = useMemo(
    () => (walletQuery.data?.pages ?? []).flatMap((page) => page.transactions),
    [walletQuery.data?.pages],
  );

  const onEndReached = () => {
    if (walletQuery.hasNextPage && !walletQuery.isFetchingNextPage) {
      void walletQuery.fetchNextPage();
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Wallet & Rewards" />

      {walletQuery.isLoading && transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : walletQuery.isError && transactions.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Text variant="body-md" className="text-center text-on-surface-variant">
            Could not load your wallet.
          </Text>
          <Pressable
            onPress={() => void walletQuery.refetch()}
            accessibilityRole="button">
            <Text variant="title-md" className="text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            paddingTop: 16,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={walletQuery.isRefetching && !walletQuery.isFetchingNextPage}
              onRefresh={() => void walletQuery.refetch()}
              tintColor={ACCENT}
            />
          }
          ListHeaderComponent={
            <View className="mb-6 gap-4">
              <View className="gap-1 rounded-2xl border border-outline-variant/30 bg-surface-container px-5 py-6">
                <Text variant="label-sm" className="text-on-surface-variant">
                  Total available coins
                </Text>
                <Text variant="headline-md" className="text-on-surface">
                  {coinFormatter.format(balance)}
                </Text>
              </View>
              <Text variant="body-md" className="text-on-surface-variant">
                Earn coins by winning community contests and admin rewards.
                More perks coming later.
              </Text>
              <Text variant="title-md" className="pt-2 text-on-surface">
                Activity
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text
                variant="body-md"
                className="text-center text-on-surface-variant">
                No transactions yet. Win a contest or receive a grant to earn
                coins.
              </Text>
            </View>
          }
          renderItem={({ item }) => <TransactionRow item={item} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            walletQuery.isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}
