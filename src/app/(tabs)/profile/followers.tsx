import { FollowListScreen } from '@/features/users/screens/follow-list-screen';
import { useMe } from '@/features/profile';

export default function MyFollowersRoute() {
  const { data } = useMe();
  return <FollowListScreen userId={data?.id} mode="followers" />;
}
