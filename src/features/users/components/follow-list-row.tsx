import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { FollowListUser } from '../api/types';

const TITLE = '#E4E1EA';
const SUBTITLE = '#958EA0';
const ACCENT = '#D0BCFF';

type FollowListRowProps = {
  user: FollowListUser;
  onPress: () => void;
  /** Hide when row is the signed-in user. */
  showFollowAction?: boolean;
  followBusy?: boolean;
  onToggleFollow?: () => void;
};

function initialFrom(name: string | null, username: string): string {
  const source = (name?.trim() || username).trim();
  return source.charAt(0).toUpperCase() || '?';
}

export function FollowListRow({
  user,
  onPress,
  showFollowAction = false,
  followBusy = false,
  onToggleFollow,
}: FollowListRowProps) {
  const title = user.name?.trim() || `@${user.username}`;
  const following = user.isFollowing;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-90">
      {user.avatarUrl ? (
        <View className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-high">
          <Image
            source={{ uri: user.avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${user.id}-follow`}
          />
        </View>
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tonal">
          <Text variant="title-md" className="text-on-primary">
            {initialFrom(user.name, user.username)}
          </Text>
        </View>
      )}

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" style={{ color: TITLE }} numberOfLines={1}>
          {title}
        </Text>
        <Text
          variant="label-md"
          className="font-normal"
          style={{ color: SUBTITLE }}
          numberOfLines={1}>
          @{user.username}
        </Text>
      </View>

      {showFollowAction && onToggleFollow ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            if (!followBusy) onToggleFollow();
          }}
          disabled={followBusy}
          accessibilityRole="button"
          accessibilityLabel={
            following ? `Unfollow ${title}` : `Follow ${title}`
          }
          hitSlop={8}
          className="min-w-[88px] items-center justify-center rounded-full px-3 py-2"
          style={{
            borderCurve: 'continuous',
            backgroundColor: following
              ? 'rgba(208,188,255,0.12)'
              : ACCENT,
          }}>
          {followBusy ? (
            <ActivityIndicator
              color={following ? ACCENT : '#1C1B1F'}
              size="small"
            />
          ) : (
            <Text
              variant="label-md"
              className="font-semibold"
              style={{ color: following ? ACCENT : '#1C1B1F' }}>
              {following ? 'Following' : 'Follow'}
            </Text>
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}
