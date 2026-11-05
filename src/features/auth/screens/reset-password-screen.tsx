import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react-native';
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

import { getErrorMessage } from '@/core/api';
import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

import { useConfirmPasswordReset } from '../api/hooks';
import { signupPasswordSchema, type SignupPasswordFormValues } from '../api/schemas';
import { AuthBackground } from '../components/auth-background';

export function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { back, replace } = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ resetToken?: string }>();
  const resetToken =
    typeof params.resetToken === 'string' ? params.resetToken : '';

  const confirmReset = useConfirmPasswordReset();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupPasswordFormValues>({
    resolver: zodResolver(signupPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!resetToken) {
      replace('/(auth)/forgot-password' as Href);
    }
  }, [resetToken, replace]);

  const busy = confirmReset.isPending;

  const onSubmit = handleSubmit((values) => {
    if (!resetToken) return;
    setApiError(null);
    confirmReset.mutate(
      { resetToken, password: values.password },
      {
        onSuccess: () => {
          replace('/(auth)/login' as Href);
        },
        onError: (err) => {
          setApiError(getErrorMessage(err, 'Could not update password.'));
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
          <OnboardingBackButton onPress={back} />

          <View className="mt-5 items-center">
            <AppLogo
              width={Math.min(width - 40, 150)}
              height={Math.round(Math.min(width - 40, 150) * (340 / 2020))}
            />
          </View>

          <View className="mt-5 items-center gap-1">
            <Text variant="headline-lg-mobile" className="text-center text-on-surface">
              Set a new password
            </Text>
            <Text variant="body-md" className="text-center text-on-surface-variant">
              Choose a strong password for your account.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <View className="gap-2">
              <Text variant="label-sm" className="uppercase text-on-surface-variant">
                New password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      placeholder="Your password"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      editable={!busy}
                      className={cn(fieldClassName, 'pr-12')}
                    />
                  )}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  hitSlop={8}
                  className="absolute right-3 top-0 h-12 w-8 items-center justify-center">
                  {showPassword ? (
                    <EyeOff size={20} color="#CBC3D7" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#CBC3D7" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {errors.password ? (
                <Text className="text-[13px] text-destructive">
                  {errors.password.message}
                </Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Text variant="label-sm" className="uppercase text-on-surface-variant">
                Confirm password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      secureTextEntry={!showConfirm}
                      autoComplete="new-password"
                      textContentType="newPassword"
                      placeholder="Confirm your password"
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      editable={!busy}
                      className={cn(fieldClassName, 'pr-12')}
                    />
                  )}
                />
                <Pressable
                  onPress={() => setShowConfirm((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel={
                    showConfirm ? 'Hide password' : 'Show password'
                  }
                  hitSlop={8}
                  className="absolute right-3 top-0 h-12 w-8 items-center justify-center">
                  {showConfirm ? (
                    <EyeOff size={20} color="#CBC3D7" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#CBC3D7" strokeWidth={2} />
                  )}
                </Pressable>
              </View>
              {errors.confirmPassword ? (
                <Text className="text-[13px] text-destructive">
                  {errors.confirmPassword.message}
                </Text>
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
              {busy ? (
                <ActivityIndicator color="#1C1B1F" />
              ) : (
                <Text>Update password</Text>
              )}
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
