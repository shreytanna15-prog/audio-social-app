import { Pressable, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { SonicStage } from '@/shared/SVGs/sonic-stage';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { OnboardingBackground } from '../components/onboarding-background';
import { OnboardingProgress } from '../components/onboarding-progress';
import { useOnboardingTasteStore } from '../store/onboarding-taste.store';

export function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const clearPreferredGenres = useOnboardingTasteStore((s) => s.clearPreferredGenres);
  const { guard } = useNavigationGuard();

  const goToLogin = () => {
    // Existing users skip genre onboarding — don't carry a stale draft into PATCH.
    clearPreferredGenres();
    guard(() => completeOnboarding());
    guard(() => router.push('/login'));
  };

  const contentWidth = Math.min(width - 32, 380);
  const logoWidth = Math.min(contentWidth, 160);
  const logoHeight = Math.round(logoWidth * (340 / 2020));
  const stageSize = Math.min(contentWidth, 288);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0e0e14',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 16,
      }}>
      <OnboardingBackground />
      <OnboardingProgress step={1} />

      <View style={{ marginTop: 32 }}>
        <AppLogo width={logoWidth} height={logoHeight} />
      </View>

      <View style={{ marginTop: 26 }}>
        <SonicStage width={stageSize} height={stageSize} />
      </View>

      <Text
        variant="display-hero-mobile"
        style={{ marginTop: 12, textAlign: 'center', color: '#e4e1ea' }}>
        Your sound.{'\n'}Your space.
      </Text>

      <Text
        variant="body-md"
        style={{ marginTop: 4, maxWidth: 280, textAlign: 'center', color: '#cbc3d7' }}>
        Discover music, create your sound, and connect with artists.
      </Text>

      <View style={{ width: contentWidth, marginTop: 28 }}>
        <Button
          variant="tonal"
          size="lg"
          onPress={() => guard(() => router.push('/genres'))}
          className="h-14 w-full rounded-md">
          <Text>Get Started</Text>
        </Button>

        <View className="mt-3 h-12 flex-row items-center justify-center">
          <Text variant="label-md" className="text-on-surface-variant">
            Already have an account?
          </Text>
          <Pressable onPress={goToLogin} accessibilityRole="link" hitSlop={8} className="ml-1 py-1">
            <Text variant="label-md" className="font-semibold text-primary-tonal">
              Log In
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}