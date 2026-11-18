import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { getErrorMessage } from '@/core/api';
import { useSignup } from '@/features/auth/api/hooks';
import {
  signupPasswordSchema,
  type SignupPasswordFormValues,
} from '@/features/auth/api/schemas';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { SignupLayout } from '../components/signup-layout';

function Requirement({ met, children }: { met: boolean; children: string }) {
  const color = met ? '#D0BCFF' : '#958EA0';
  const Icon = met ? CheckCircle2 : Circle;

  return (
    <View className="flex-row items-center gap-1.5">
      <Icon size={13} color={color} strokeWidth={1.8} />
      <Text variant="caption" style={{ color }}>
        {children}
      </Text>
    </View>
  );
}

export function SignupScreenThree() {
  const { replace } = useRouter();
  const { guard } = useNavigationGuard();
  const signupMutation = useSignup();
  const draft = useAuthStore((s) => s.signupDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupPasswordFormValues>({
    resolver: zodResolver(signupPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password') ?? '';
  const hasMinimumLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasNumberOrSymbol = hasNumber || hasSymbol;
  const strength =
    Number(hasMinimumLength) + Number(hasLetter) + Number(hasNumberOrSymbol);
  const strengthLabel = strength >= 3 ? 'Strong' : strength >= 2 ? 'Good' : 'Weak';

  const busy = signupMutation.isPending;

  const onCreateAccount = handleSubmit((values) => {
    if (!draft.name || !draft.email || !draft.username) {
      setApiError('Please complete the previous signup steps first.');
      guard(() => replace('/signup'));
      return;
    }

    setApiError(null);
    signupMutation.mutate(
      {
        name: draft.name,
        username: draft.username,
        email: draft.email,
        password: values.password,
      },
      {
        onError: (err) => {
          setApiError(getErrorMessage(err, 'Signup failed.'));
        },
      },
    );
  });

  return (
    <SignupLayout
      step={3}
      title="Create your password"
      description="Choose a strong password with at least 8 characters to secure your music library and profile.">
      <View className="mt-6 gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="label-sm" className="text-on-surface-variant uppercase">
            Password
          </Text>
          <Text variant="caption" className="text-outline">
            {strengthLabel}
          </Text>
        </View>
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
            onPress={() => setShowPassword((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={8}
            className="absolute right-3 top-0 h-12 w-8 items-center justify-center">
            {showPassword ? (
              <EyeOff size={18} color="#CBC3D7" strokeWidth={2} />
            ) : (
              <Eye size={18} color="#CBC3D7" strokeWidth={2} />
            )}
          </Pressable>
        </View>

        <View className="flex-row gap-1">
          {[0, 1, 2].map((segment) => (
            <View
              key={segment}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: segment < strength ? '#A078FF' : '#34343B' }}
            />
          ))}
        </View>

        <View className="gap-1">
          <Requirement met={hasMinimumLength}>At least 8 characters</Requirement>
          <Requirement met={hasLetter}>Includes a letter</Requirement>
          <Requirement met={hasNumberOrSymbol}>Includes a number or symbol</Requirement>
        </View>
        {errors.password ? (
          <Text className="text-[13px] text-destructive">{errors.password.message}</Text>
        ) : null}
      </View>

      <View className="mt-4 gap-2">
        <Text variant="label-sm" className="text-on-surface-variant uppercase">
          Confirm password
        </Text>
        <View className="relative">
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                secureTextEntry={!showConfirmPassword}
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
            onPress={() => setShowConfirmPassword((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
            hitSlop={8}
            className="absolute right-3 top-0 h-12 w-8 items-center justify-center">
            {showConfirmPassword ? (
              <EyeOff size={18} color="#CBC3D7" strokeWidth={2} />
            ) : (
              <Eye size={18} color="#CBC3D7" strokeWidth={2} />
            )}
          </Pressable>
        </View>
        {errors.confirmPassword ? (
          <Text className="text-[13px] text-destructive">{errors.confirmPassword.message}</Text>
        ) : null}
      </View>

      {apiError ? (
        <Text className="mt-3 text-[13px] text-destructive">{apiError}</Text>
      ) : null}

      <Button
        variant="tonal"
        size="lg"
        onPress={onCreateAccount}
        disabled={!isValid || busy || !draft.name || !draft.email || !draft.username}
        className="mt-5 h-14 w-full rounded-md">
        {busy ? (
          <ActivityIndicator color="#1C1B1F" />
        ) : (
          <Text>Create Account</Text>
        )}
      </Button>

      <Text variant="caption" className="mt-4 text-center leading-relaxed text-outline">
        By creating an account, you agree to VibeOGram&apos;s{' '}
        <Text variant="caption" className="text-on-surface-variant underline">
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text variant="caption" className="text-on-surface-variant underline">
          Privacy Policy
        </Text>
        .
      </Text>
    </SignupLayout>
  );
}
