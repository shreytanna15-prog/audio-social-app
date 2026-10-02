import { View } from 'react-native';

import { useAuthStore } from '@/features/auth';
import { AppHeader } from '@/shared/components/layout/app-header';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <View className="flex-1 bg-background">
      <AppHeader />
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text variant="headline-lg-mobile" className="text-on-surface">
          Profile
        </Text>
        <Button variant="outline" onPress={() => void logout()}>
          <Text>Log out</Text>
        </Button>
      </View>
    </View>
  );
}
