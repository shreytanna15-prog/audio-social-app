import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getErrorMessage } from '@/core/api';
import { useLogin } from '@/features/auth/api/hooks';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password to continue.');
      return;
    }

    setError(null);
    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onError: (err) => {
          setError(getErrorMessage(err, 'Login failed.'));
        },
      },
    );
  };

  const busy = loginMutation.isPending;

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
            Welcome back
          </Text>
          <Text variant="headline-lg-mobile" className="text-left text-ink">
            Log in
          </Text>
          <Text variant="body-lg" className="text-slate">
            Sign in to keep recording, polishing, and sharing your audio.
          </Text>
        </View>

        <View className="border-border/80 bg-card gap-5 rounded-3xl border p-5">
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
              autoComplete="password"
              textContentType="password"
              placeholder="Your password"
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

          <Button size="lg" onPress={handleLogin} disabled={busy} className="mt-1 w-full">
            <Text>{busy ? 'Logging in…' : 'Log in'}</Text>
          </Button>
        </View>

        <Pressable
          onPress={() => push('/signup')}
          className="mt-8 items-center py-3"
          disabled={busy}>
          <Text className="text-muted-foreground text-[15px]">
            Don&apos;t have an account?{' '}
            <Text className="text-foreground font-semibold">Sign up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
