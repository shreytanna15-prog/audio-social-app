import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import {
  signupNameSchema,
  type SignupNameFormValues,
} from '@/features/auth/api/schemas';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

import { SignupLayout } from '../components/signup-layout';

const MAX_NAME_LENGTH = 40;

export function SignupScreenOne() {
  const { push } = useRouter();
  const setSignupDraft = useAuthStore((s) => s.setSignupDraft);
  const draftName = useAuthStore((s) => s.signupDraft.name ?? '');

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupNameFormValues>({
    resolver: zodResolver(signupNameSchema),
    mode: 'onChange',
    defaultValues: { name: draftName },
  });

  const name = watch('name') ?? '';

  const onContinue = handleSubmit((values) => {
    setSignupDraft({ name: values.name.trim() });
    push('/signup-two');
  });

  return (
    <SignupLayout
      step={1}
      title="What's your name?"
      description="This is how you'll appear to other artists and listeners across VibeOGram.">
      <View className="mt-6 gap-2">
        <View className="flex-row items-center justify-between">
          <Text variant="label-sm" className="text-on-surface-variant uppercase">
            Full name
          </Text>
          <Text variant="caption" className="text-outline">
            {name.length} / {MAX_NAME_LENGTH}
          </Text>
        </View>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              textContentType="name"
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Maya Lin"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              className="h-12 rounded-md border-0 bg-surface-container p-4 text-sm"
            />
          )}
        />
        {errors.name ? (
          <Text className="text-[13px] text-destructive">{errors.name.message}</Text>
        ) : null}
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
