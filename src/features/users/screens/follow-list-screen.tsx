import { type Href, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { getMe } from '@/features/profile/api/service';
import { ME_QUERY_KEY } from '@/features/profile/api/query-keys';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';

import {
  useFollowers,
  useFollowing,
  useFollowUser,
  useUnfollowUser,
} from '../api/hooks';
import type { FollowListUser } from '../api/types';
import { FollowListRow } from '../components/follow-list-row';

const ACCENT = '#D0BCFF';
const LIST_BOTTOM_PAD = 120;

export type FollowListMode = 'followers' | 'following';

type FollowListScreenProps = {
  userId: string | undefined;
  mode: FollowListMode;
};

export function FollowListScreen({ userId, mode }: FollowListScreenProps) {
  const { push } = useRouter();
  const { data: me } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
  });
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [busyId, setBusyId] = useState<string | null>(null);
  const followersQuery = useFollowers(
    mode === 'followers' ? userId : undefined,
  );
  const followingQuery = useFollowing(
    mode === 'following' ? userId : undefined,
  );
  const query = mode === 'followers' ? followersQuery : followingQuery;

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data?.pages],
  );

  const title = mode === 'followers' ? 'Followers' : 'Following';
  const emptyLabel =
    mode === 'followers' ? 'No followers yet' : 'Not following anyone yet';

  const openUser = (user: FollowListUser) => {
    push(`/artist/${user.id}` as Href);
  };

  const toggleFollow = async (user: FollowListUser) => {
    if (!me?.id || me.id === user.id || busyId) return;
    setBusyId(user.id);
    try {
      if (user.isFollowing) {
        await unfollow.mutateAsync(user.id);
      } else {
        await follow.mutateAsync(user.id);
      }
      await query.refetch();
    } catch {
      // Hooks already roll back profile cache; list refetch restores row state.
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title={title} />

      {query.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : null}

      {!query.isLoading && query.isError ? (
        <View className="items-center gap-2 px-4 py-16">
          <Text
            variant="body-md"
            className="text-center text-on-surface-variant">
            Couldn’t load {title.toLowerCase()}.
          </Text>
          <Pressable
            onPress={() => {
              void query.refetch();
            }}
            accessibilityRole="button"
            hitSlop={8}>
            <Text
              variant="label-md"
              className="font-semibold text-primary-tonal">
              Retry
            </Text>
          </Pressable>
        </View>
      ) : null}

      {!query.isLoading && !query.isError ? (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: LIST_BOTTOM_PAD }}
          renderItem={({ item }) => (
            <FollowListRow
              user={item}
              onPress={() => openUser(item)}
              showFollowAction={Boolean(me?.id) && me?.id !== item.id}
              followBusy={busyId === item.id}
              onToggleFollow={() => {
                void toggleFollow(item);
              }}
            />
          )}
          ListEmptyComponent={
            <Text
              variant="body-md"
              className="px-4 py-10 text-center text-on-surface-variant">
              {emptyLabel}
            </Text>
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null
          }
        />
      ) : null}
    </View>
  );
}
