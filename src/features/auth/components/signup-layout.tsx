import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';
import { OnboardingProgress } from '@/features/onboarding/components/onboarding-progress';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Text } from '@/shared/components/ui/text';

import { AuthBackground } from './auth-background';

type SignupLayoutProps = {
  step: 1 | 2 | 3;
  title: string;
  description: string;
  children: ReactNode;
};

export function SignupLayout({ step, title, description, children }: SignupLayoutProps) {
  const insets = useSafeAreaInsets();
  const { back, push } = useRouter();
  const { width } = useWindowDimensions();

  const contentWidth = Math.min(width - 32, 520);
  const logoWidth = Math.min(contentWidth, 150);

  return (
    <KeyboardAvoidingView
      className="flex-1 overflow-hidden bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthBackground />
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={{ width: contentWidth, alignSelf: 'center' }}>
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={back} />
            <OnboardingProgress step={step} />
          </View>

          <View className="mt-5 items-center">
            <AppLogo
              width={logoWidth}
              height={Math.round(logoWidth * (340 / 2020))}
            />
          </View>

          <View className="mt-4 items-center gap-1">
            <Text variant="headline-lg-mobile" className="text-center text-on-surface">
              {title}
            </Text>
            <Text variant="body-md" className="max-w-75 text-center text-on-surface-variant">
              {description}
            </Text>
          </View>

          {children}

          <View className="mt-4 flex-row items-center justify-center">
            <Text variant="label-md" className="text-on-surface-variant">
              Already have an account?
            </Text>
            <Pressable
              onPress={() => push('/login')}
              accessibilityRole="link"
              hitSlop={8}
              className="ml-1 py-1">
              <Text variant="label-md" className="font-semibold text-primary-tonal">
                Log In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
