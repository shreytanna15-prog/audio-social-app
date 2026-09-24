import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const logout = useAuthStore((s) => s.logout);

  return (
    <View
      className="flex-1 items-center justify-center gap-4 bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Text variant="headline-lg-mobile" className="text-ink">
        VibeOGram Home
      </Text>
      <Text variant="body-md" className="text-center text-slate">
        Placeholder home. Audio tab still works as before.
      </Text>
      <Button variant="outline" onPress={() => void logout()}>
        <Text>Log out</Text>
      </Button>
    </View>
  );
}
