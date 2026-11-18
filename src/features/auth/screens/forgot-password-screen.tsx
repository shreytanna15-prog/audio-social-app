import { zodResolver } from '@hookform/resolvers/zod';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

import { getErrorMessage } from '@/core/api';
import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { useRequestPasswordReset } from '../api/hooks';
import { AuthBackground } from '../components/auth-background';

const schema = z.object({
  email: z.email('Invalid email address'),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { back, push } = useRouter();
  const { width } = useWindowDimensions();
  const requestReset = useRequestPasswordReset();
  const { guard } = useNavigationGuard();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const busy = requestReset.isPending;

  const onSubmit = handleSubmit((values) => {
    setApiError(null);
    const email = values.email.trim().toLowerCase();
    requestReset.mutate(
      { email },
      {
        onSuccess: () => {
          guard(() => push(
            `/(auth)/verify-reset-otp?email=${encodeURIComponent(email)}` as Href,
          ));
        },
        onError: (err) => {
          setApiError(getErrorMessage(err, 'Could not send reset code.'));
        },
      },
    );
  });

  return (
    <KeyboardAvoidingView
      className="flex-1 overflow-hidden bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthBackground />
      <ScrollView
        contentContainerClassName="flex-grow"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="w-full max-w-130 self-center">
          <OnboardingBackButton onPress={() => guard(() => back())} />

          <View className="mt-5 items-center">
            <AppLogo
              width={Math.min(width - 40, 150)}
              height={Math.round(Math.min(width - 40, 150) * (340 / 2020))}
            />
          </View>

          <View className="mt-5 items-center gap-1">
            <Text variant="headline-lg-mobile" className="text-center text-on-surface">
              Forgot your password?
            </Text>
            <Text variant="body-md" className="text-center text-on-surface-variant">
              Enter your account email and we&apos;ll send a 6-digit code.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <View className="gap-2">
              <Text variant="label-sm" className="uppercase text-on-surface-variant">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    testID="forgot-email-input"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder="you@example.com"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    editable={!busy}
                    className={fieldClassName}
                  />
                )}
              />
              {errors.email ? (
                <Text className="text-[13px] text-destructive">{errors.email.message}</Text>
              ) : null}
            </View>

            {apiError ? (
              <View className="rounded-xl bg-destructive/10 px-3.5 py-3">
                <Text className="text-[13px] leading-5 text-destructive">{apiError}</Text>
              </View>
            ) : null}

            <Button
              variant="tonal"
              size="lg"
              onPress={onSubmit}
              disabled={busy}
              className="h-14 w-full rounded-md">
              {busy ? <ActivityIndicator color="#1C1B1F" /> : <Text>Send code</Text>}
            </Button>
          </View>

          <Pressable
            onPress={() => guard(() => back())}
            accessibilityRole="link"
            disabled={busy}
            className="mt-8 items-center py-3">
            <Text variant="label-md" className="font-semibold text-primary-tonal">
              Back to Log In
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
