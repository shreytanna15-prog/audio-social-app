import { useLocalSearchParams } from 'expo-router';

import { FollowListScreen } from '@/features/users/screens/follow-list-screen';

export default function ArtistFollowingRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <FollowListScreen
      userId={typeof id === 'string' ? id : undefined}
      mode="following"
    />
  );
}
