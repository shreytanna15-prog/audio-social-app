import { FollowListScreen } from '@/features/users/screens/follow-list-screen';
import { useMe } from '@/features/profile';

export default function MyFollowingRoute() {
  const { data } = useMe();
  return <FollowListScreen userId={data?.id} mode="following" />;
}
