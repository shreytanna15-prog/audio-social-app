import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth';
import { Button } from '@/shared/components/ui/button';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { OnboardingBackButton } from '../components/onboarding-back-button';
import { OnboardingBackground } from '../components/onboarding-background';
import { OnboardingProgress } from '../components/onboarding-progress';

const RINGS = [
  { size: 288, color: 'rgba(139, 92, 246, 0.08)' },
  { size: 240, color: 'rgba(139, 92, 246, 0.10)' },
  { size: 192, color: 'rgba(196, 181, 253, 0.12)' },
];

function AppIconCarrier() {
  return (
    <View
      style={{
        width: 136,
        height: 136,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#8B5CF6',
        shadowOpacity: 0.3,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 0 },
        elevation: 12,
      }}>
      <Image
        source={require('@/assets/icon-logo.png')}
        contentFit="contain"
        accessibilityLabel="VibeOGram app logo"
        style={{ width: 128, height: 128, borderRadius: 28 }}
      />
    </View>
  );
}

export function AuthEntryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const { guard } = useNavigationGuard();

  const goTo = (href: '/login' | '/signup') => {
    guard(() => completeOnboarding());
    guard(() => router.push(href));
  };

  return (
    <View
      className="flex-1 overflow-hidden bg-surface-container-lowest"
      style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
      <OnboardingBackground />
      <View className="flex-row items-center justify-between px-5 py-1">
        <OnboardingBackButton onPress={() => guard(() => router.back())} />
        <OnboardingProgress step={3} />
        <View className="h-10 w-10" />
      </View>

      <View className="flex-1 items-center justify-center px-5">
        <View style={{ width: 288, height: 288, alignItems: 'center', justifyContent: 'center' }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255, 176, 205, 0.08)',
            }}
          />
          {RINGS.map((ring) => (
            <View
              key={ring.size}
              style={{
                position: 'absolute',
                width: ring.size,
                height: ring.size,
                borderRadius: ring.size / 2,
                backgroundColor: ring.color,
              }}
            />
          ))}
          <AppIconCarrier />
        </View>

        <View className="mt-6 flex-col items-center gap-2">
          <Text variant="headline-lg-mobile" className="text-center text-on-surface">
            Welcome to VibeOGram
          </Text>
          <Text variant="body-md" className="max-w-75 text-center text-on-surface-variant">
            Create, shape, and share your sound with a community of artists.
          </Text>
        </View>
      </View>

      <View className="flex-col px-5">
        <Button
          variant="tonal"
          size="lg"
          onPress={() => goTo('/signup')}
          className="h-14 w-full rounded-md">
          <Text>Create Account</Text>
        </Button>

        <Button
          variant="surface"
          size="lg"
          onPress={() => goTo('/login')}
          className="mt-3 h-14 w-full rounded-md">
          <Text className="font-semibold">Log In</Text>
        </Button>

        <Text variant="caption" className="mt-6 text-center leading-relaxed text-outline">
          By continuing, you agree to VibeOGram&apos;s{' '}
          <Text variant="caption" className="text-on-surface-variant underline">Terms of Service</Text> &{' '}
          <Text variant="caption" className="text-on-surface-variant underline">Privacy Policy</Text>.
        </Text>
      </View>
    </View>
  );
}