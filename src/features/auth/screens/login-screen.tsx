import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
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

import { getErrorMessage } from '@/core/api';
import { useLogin } from '@/features/auth/api/hooks';
import { loginSchema, type LoginFormValues } from '@/features/auth/api/schemas';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { OnboardingBackButton } from '@/features/onboarding/components/onboarding-back-button';
import { AppLogo } from '@/shared/components/brand/app-logo';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { AuthBackground } from '../components/auth-background';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { back, canGoBack, push } = useRouter();
  const { width } = useWindowDimensions();
  const resetOnboarding = useAuthStore((state) => state.resetOnboarding);
  const loginMutation = useLogin();
  const { guard } = useNavigationGuard();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setApiError(null);
    loginMutation.mutate(
      { email: values.email.trim(), password: values.password },
      {
        onError: (err) => {
          setApiError(getErrorMessage(err, 'Login failed.'));
        },
      },
    );
  });

  const handleRestartOnboarding = () => {
    resetOnboarding();
    guard(() => push('/welcome'));
  };

  const busy = loginMutation.isPending;

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
          {canGoBack() ? (
            <View className="flex-row items-center">
              <OnboardingBackButton onPress={() => guard(() => back())} />
            </View>
          ) : null}

          <View className="mt-5 items-center">
            <AppLogo
              width={Math.min(width - 40, 150)}
              height={Math.round(Math.min(width - 40, 150) * (340 / 2020))}
            />
          </View>

          <View className="mt-5 items-center gap-1">
            <Text variant="headline-lg-mobile" className="text-center text-on-surface">
              Welcome back
            </Text>
            <Text variant="body-md" className="text-center text-on-surface-variant">
              Continue where you left off.
            </Text>
          </View>

          <View className="mt-8 gap-4">
            <View className="gap-2">
              <Text variant="label-sm" className="text-on-surface-variant uppercase">
                Email
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
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

            <View className="gap-2">
              <Text variant="label-sm" className="text-on-surface-variant uppercase">
                Password
              </Text>
              <View className="relative">
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      textContentType="password"
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
                  onPress={() => setShowPassword((visible) => !visible)}
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
                <Text className="text-[13px] text-destructive">{errors.password.message}</Text>
              ) : null}
              <Pressable
                onPress={() => guard(() => push('../forgot-password'))}
                accessibilityRole="link"
                disabled={busy}
                className="self-end py-1">
                <Text variant="label-sm" className="text-primary-tonal">
                  Forgot password?
                </Text>
              </Pressable>
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
                <Text>Log In</Text>
              )}
            </Button>
          </View>

          <View className="mt-7 flex-row items-center justify-center">
            <Text variant="label-md" className="text-on-surface-variant">
              Don&apos;t have an account?
            </Text>
            <Pressable
              onPress={() => guard(() => push('/signup'))}
              accessibilityRole="link"
              disabled={busy}
              hitSlop={8}
              className="ml-1 py-1">
              <Text variant="label-md" className="font-semibold text-primary-tonal">
                Create Account
              </Text>
            </Pressable>
          </View>

          <Button
            variant="outline"
            size="sm"
            onPress={handleRestartOnboarding}
            disabled={busy}
            className="mt-5 self-center rounded-lg">
            <Text>Restart onboarding</Text>
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
