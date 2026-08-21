import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { logoutMock } = useAuthStore();

  return (
    <View
      className="flex-1 items-center justify-center gap-4 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text variant="h3">Home</Text>
      <Text variant="muted" className="text-center">
        Placeholder home. Audio tab still works as before.
      </Text>
      <Button variant="outline" onPress={logoutMock}>
        <Text>Log out</Text>
      </Button>
    </View>
  );
}
