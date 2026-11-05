import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useFollowUser, useUnfollowUser } from '@/features/users';
import { Text } from '@/shared/components/ui/text';

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const profileId = typeof id === 'string' ? id : undefined;
  const { profile, apiProfile, isLoading, isError, refetch } =
    usePublicProfile(profileId);
  const sheetBottomOffset = useProfileSheetBottomOffset();

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [messageOpen, setMessageOpen] = useState(false);

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
            onMessagePress={() => setMessageOpen(true)}
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
