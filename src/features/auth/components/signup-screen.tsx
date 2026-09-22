import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api';
import { useSignup } from '@/features/auth/api/hooks';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

export function SignupScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const signupMutation = useSignup();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Enter name, email, and password to continue.');
      return;
    }

    setError(null);
    signupMutation.mutate(
      {
        name: name.trim(),
        email: email.trim(),
        password,
      },
      {
        onError: (err) => {
          setError(getErrorMessage(err, 'Signup failed.'));
        },
      },
    );
  };

  const busy = signupMutation.isPending;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerClassName="flex-grow px-6"
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 28,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-10 gap-3">
          <Text variant="label-sm" className="text-lavender tracking-[2px] uppercase">
            Get started
          </Text>
          <Text variant="headline-lg-mobile" className="text-left text-ink">
            Create account
          </Text>
          <Text variant="body-lg" className="text-slate">
            Join with your name and email. Use a strong password (8+ chars with upper, lower,
            number, and symbol).
          </Text>
        </View>

        <View className="border-border/80 bg-card gap-5 rounded-3xl border p-5">
          <View className="gap-2">
            <Text className="text-foreground/80 text-[13px] font-semibold">Name</Text>
            <Input
              autoComplete="name"
              textContentType="name"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              editable={!busy}
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground/80 text-[13px] font-semibold">Email</Text>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              editable={!busy}
            />
          </View>

          <View className="gap-2">
            <Text className="text-foreground/80 text-[13px] font-semibold">Password</Text>
            <Input
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              editable={!busy}
            />
          </View>

          {error ? (
            <View className="bg-destructive/10 rounded-2xl px-3.5 py-3">
              <Text className="text-destructive text-[13px] leading-5">{error}</Text>
            </View>
          ) : null}

          <Button size="lg" onPress={handleSignup} disabled={busy} className="mt-1 w-full">
            <Text>{busy ? 'Creating account…' : 'Create account'}</Text>
          </Button>
        </View>

        <Pressable
          onPress={() => push('/login')}
          className="mt-8 items-center py-3"
          disabled={busy}>
          <Text className="text-muted-foreground text-[15px]">
            Already have an account?{' '}
            <Text className="text-foreground font-semibold">Log in</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
