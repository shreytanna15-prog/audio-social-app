import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { useAuthStore } from '@/features/auth';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ProfileScreenShell } from '../components/profile-screen-shell';
import { ProfileSelfActions } from '../components/profile-self-actions';
import { useMyProfile } from '../hooks/use-my-profile';

/** Profile tab — logged-in user; Edit / Library actions. */
export function MyProfileScreen() {
  const { push } = useRouter();
  const { profile, isLoading, isError, refetch } = useMyProfile();
  const logout = useAuthStore((s) => s.logout);
  const { guard } = useNavigationGuard();

  useFocusEffect(
    useCallback(() => {
      // no-op: guard resets automatically via its own timer
    }, []),
  );

  const goTo = (href: Href) => {
    guard(() => push(href));
  };

  if (isLoading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Could not load your profile.
        </Text>
        <Pressable onPress={refetch} accessibilityRole="button">
          <Text variant="title-md" className="text-primary-tonal">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ProfileScreenShell
      profile={profile}
      actions={
        <ProfileSelfActions
          onEditPress={() => goTo('/(tabs)/profile/edit' as Href)}
          onLibraryPress={() =>
            goTo({
              pathname: '/(tabs)/library',
              params: { from: 'profile' },
            } as Href)
          }
        />
      }
      onFollowersPress={() => goTo('/(tabs)/profile/followers' as Href)}
      onFollowingPress={() => goTo('/(tabs)/profile/following' as Href)}
      onLogout={() => {
        void logout();
      }}
    />
  );
}
