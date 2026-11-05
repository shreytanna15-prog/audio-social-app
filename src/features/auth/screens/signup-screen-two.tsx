import { zodResolver } from '@hookform/resolvers/zod';
import { AtSign } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import {
  signupIdentitySchema,
  type SignupIdentityFormValues,
} from '@/features/auth/api/schemas';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui/button';
import { fieldClassName } from '@/shared/components/ui/field-styles';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

import { SignupLayout } from '../components/signup-layout';

const MAX_USERNAME_LENGTH = 20;

export function SignupScreenTwo() {
  const { push } = useRouter();
  const setSignupDraft = useAuthStore((s) => s.setSignupDraft);
  const draft = useAuthStore((s) => s.signupDraft);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupIdentityFormValues>({
    resolver: zodResolver(signupIdentitySchema),
    mode: 'onChange',
    defaultValues: {
      email: draft.email ?? '',
      username: draft.username ?? '',
    },
  });

  const username = watch('username') ?? '';

  const onContinue = handleSubmit((values) => {
    setSignupDraft({
      email: values.email.trim().toLowerCase(),
      username: values.username,
    });
    push('/signup-three');
  });

  return (
    <SignupLayout
      step={2}
      title="Create your identity"
      description="Your email secures your account, and your username is how artists and listeners discover you.">
      <View className="mt-6 gap-5">
        <View className="gap-2">
          <Text variant="label-sm" className="text-on-surface-variant uppercase">
            Email address
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
            Username
          </Text>
          <View className="relative">
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  textContentType="username"
                  maxLength={MAX_USERNAME_LENGTH}
                  placeholder="yourhandle"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.replace(/\s/g, ''))}
                  className={cn(fieldClassName, 'pr-12')}
                />
              )}
            />
            <AtSign
              size={18}
              color="#958EA0"
              strokeWidth={2}
              style={{ position: 'absolute', right: 14, top: 15 }}
            />
          </View>
          <View className="flex-row items-center justify-between">
            <Text variant="caption" className="text-outline">
              Must be 3-20 characters. Changeable later.
            </Text>
            <Text variant="caption" className="text-outline">
              {username.length} / {MAX_USERNAME_LENGTH}
            </Text>
          </View>
          {errors.username ? (
            <Text className="text-[13px] text-destructive">{errors.username.message}</Text>
          ) : null}
        </View>
      </View>

      <Button
        variant="tonal"
        size="lg"
        onPress={onContinue}
        disabled={!isValid}
        className="mt-5 h-14 w-full rounded-md">
        <Text>Continue</Text>
      </Button>
    </SignupLayout>
  );
}
