import { useRouter } from 'expo-router';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/shared/components/brand/app-logo';
import { Text } from '@/shared/components/ui/text';

import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';

import { AuthBackground } from '../components/auth-background';

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { back } = useRouter();
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(width - 32, 150);

  return (
    <View
      className="flex-1 overflow-hidden bg-background px-4"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <AuthBackground />
      <OnboardingBackButton onPress={back} />

      <View className="mt-5 items-center">
        <AppLogo width={logoWidth} height={Math.round(logoWidth * (340 / 2020))} />
      </View>

      <View className="mt-8 items-center gap-2">
        <Text variant="headline-lg-mobile" className="text-center text-on-surface">
          Forgot your password?
        </Text>
        <Text variant="body-md" className="max-w-75 text-center text-on-surface-variant">
          Password recovery is not available yet. Return to Log In to continue.
        </Text>
      </View>

      <Pressable onPress={back} accessibilityRole="link" className="mt-8 items-center py-3">
        <Text variant="label-md" className="font-semibold text-primary-tonal">
          Back to Log In
        </Text>
      </Pressable>
    </View>
  );
}
