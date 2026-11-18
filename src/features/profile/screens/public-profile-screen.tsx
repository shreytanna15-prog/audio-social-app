import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useConversations } from '@/features/message';
import { useFollowUser, useUnfollowUser } from '@/features/users';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ProfileMessageSheet } from '../components/profile-message-sheet';
import { ProfilePublicActions } from '../components/profile-public-actions';
import {
  ProfileScreenShell,
  useProfileSheetBottomOffset,
} from '../components/profile-screen-shell';
import { usePublicProfile } from '../hooks/use-public-profile';

const ACCENT = '#D0BCFF';

/** Public profile via /artist/[id] — Follow / Message actions. */
export function PublicProfileScreen() {
  const { push } = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const profileId = typeof id === 'string' ? id : undefined;
  const { profile, apiProfile, isLoading, isError, refetch } =
    usePublicProfile(profileId);
  const sheetBottomOffset = useProfileSheetBottomOffset();
  const conversationsQuery = useConversations();
  const { guard } = useNavigationGuard();

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [messageOpen, setMessageOpen] = useState(false);

  const findThreadWithUser = (userId: string) =>
    (conversationsQuery.data ?? []).find(
      (item) => item.participant.id === userId,
    );

  const handleMessagePress = async () => {
    if (!apiProfile) return;

    const cached = findThreadWithUser(apiProfile.id);
    if (cached) {
      guard(() => push(`/message/${cached.id}` as Href));
      return;
    }

    const { data } = await conversationsQuery.refetch();
    const existing = (data ?? []).find(
      (item) => item.participant.id === apiProfile.id,
    );
    if (existing) {
      guard(() => push(`/message/${existing.id}` as Href));
      return;
    }

    setMessageOpen(true);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (isError || !profile || !apiProfile) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Couldn’t load this profile.
        </Text>
        <Pressable
          onPress={refetch}
          accessibilityRole="button"
          hitSlop={8}>
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  const toggleFollow = () => {
    if (!profileId || apiProfile.isSelf) {
      return;
    }
    if (apiProfile.isFollowing) {
      unfollow.mutate(profileId);
      return;
    }
    follow.mutate(profileId);
  };

  return (
    <ProfileScreenShell
      profile={profile}
      actions={
        apiProfile.isSelf ? null : (
          <ProfilePublicActions
            name={profile.name}
            following={apiProfile.isFollowing}
            onToggleFollow={toggleFollow}
            onMessagePress={() => {
              void handleMessagePress();
            }}
          />
        )
      }
      messageSheet={
        <ProfileMessageSheet
          open={messageOpen}
          onOpenChange={setMessageOpen}
          profileName={profile.name}
          targetUserId={apiProfile.id}
          bottomOffset={sheetBottomOffset}
        />
      }
    />
  );
}
