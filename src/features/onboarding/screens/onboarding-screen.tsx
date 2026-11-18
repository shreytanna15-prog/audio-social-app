import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuthStore();
  const { guard } = useNavigationGuard();

  return (
    <View
      className="flex-1 justify-between bg-background px-6"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}>
      <View className="gap-4">
        <Text variant="h1" className="text-left">
          Welcome
        </Text>
        <Text variant="lead" className="text-left">
          Onboarding screen placeholder text. This is just testing the screen till design gets ready.
        </Text>
      </View>

      <Button onPress={() => guard(() => completeOnboarding())}>
        <Text>Get started</Text>
      </Button>
    </View>
  );
}
