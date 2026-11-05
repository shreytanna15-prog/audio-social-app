import { zodResolver } from '@hookform/resolvers/zod';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { getErrorMessage, isApiError } from '@/core/api';
import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

import {
  useRequestPasswordReset,
  useVerifyPasswordResetOtp,
} from '../api/hooks';
import { AuthBackground } from '../components/auth-background';

const RESEND_COOLDOWN_SEC = 120;

const schema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

type FormValues = z.infer<typeof schema>;

export function VerifyResetOtpScreen() {
  const insets = useSafeAreaInsets();
  const { back, push, replace } = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';

  const verifyOtp = useVerifyPasswordResetOtp();
  const requestReset = useRequestPasswordReset();
  const [apiError, setApiError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SEC);
  /** Remount TextInput when non-digits are typed so Android doesn't flicker. */
  const [otpFieldKey, setOtpFieldKey] = useState(0);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (!email) {
      replace('/(auth)/forgot-password' as Href);
    }
  }, [email, replace]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const busy = verifyOtp.isPending || requestReset.isPending;

  const onSubmit = handleSubmit((values) => {
    if (!email) return;
    setApiError(null);
    verifyOtp.mutate(
      { email, otp: values.otp.trim() },
      {
        onSuccess: (data) => {
          push(
            `/(auth)/reset-password?resetToken=${encodeURIComponent(data.resetToken)}` as Href,
          );
        },
        onError: (err) => {
          setApiError(getErrorMessage(err, 'Invalid code.'));
        },
      },
    );
  });

  const onResend = () => {
    if (!email || secondsLeft > 0 || busy) return;
    setApiError(null);
    requestReset.mutate(
      { email },
      {
        onSuccess: () => {
          setSecondsLeft(RESEND_COOLDOWN_SEC);
        },
        onError: (err) => {
          if (isApiError(err) && err.code === 'RESEND_COOLDOWN') {
            setSecondsLeft(RESEND_COOLDOWN_SEC);
          }
          setApiError(getErrorMessage(err, 'Could not resend code.'));
        },
      },
    );
  };

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
          <OnboardingBackButton onPress={back} />

          <View className="mt-5 items-center">
            <AppLogo
              width={Math.min(width - 40, 150)}
              height={Math.round(Math.min(width - 40, 150) * (340 / 2020))}
            />
          </View>

          <View className="mt-5 items-center gap-1">
            <Text variant="headline-lg-mobile" className="text-center text-on-surface">
              Enter verification code
            </Text>
            <Text variant="body-md" className="text-center text-on-surface-variant">
              We sent a 6-digit code to {email || 'your email'}.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <View className="gap-2 overflow-visible">
              <Text
                variant="label-sm"
                className="overflow-visible leading-5 uppercase text-on-surface-variant">
                Code
              </Text>
              <Controller
                control={control}
                name="otp"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    key={otpFieldKey}
                    testID="reset-otp-input"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    keyboardType="number-pad"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const next = text.replace(/\D/g, '').slice(0, 6);
                      if (next !== text) {
                        setOtpFieldKey((k) => k + 1);
                      }
                      onChange(next);
                    }}
                    editable={!busy}
                    contextMenuHidden
                    className={fieldClassName}
                  />
                )}
              />
              {errors.otp ? (
                <Text className="text-[13px] text-destructive">{errors.otp.message}</Text>
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
              {verifyOtp.isPending ? (
                <ActivityIndicator color="#1C1B1F" />
              ) : (
                <Text>Verify code</Text>
              )}
            </Button>

            <Pressable
              onPress={onResend}
              disabled={busy || secondsLeft > 0}
              accessibilityRole="button"
              className="items-center py-2">
              <Text
                variant="label-md"
                className={
                  secondsLeft > 0
                    ? 'text-on-surface-variant'
                    : 'font-semibold text-primary-tonal'
                }>
                {secondsLeft > 0
                  ? `Resend code in ${secondsLeft}s`
                  : requestReset.isPending
                    ? 'Sending…'
                    : 'Resend code'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
