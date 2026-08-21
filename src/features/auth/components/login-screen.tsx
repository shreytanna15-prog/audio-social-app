import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuthStore } from '@/features/auth/store/auth.store';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Text } from '@/shared/components/ui/text';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { loginMock } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) {
      setError('Enter email and password to continue.');
      return;
    }

    setError(null);
    loginMock();
  };

  return (
    <View
      className="flex-1 bg-background px-6"
      style={{ paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }}>
      <View className="mb-8 gap-2">
        <Text variant="h2" className="border-0 pb-0 text-left">
          Log in
        </Text>
        <Text variant="muted">Use any non-empty email and password for now.</Text>
      </View>

      <View className="gap-4">
        <View className="gap-2">
          <Text variant="small">Email</Text>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="gap-2">
          <Text variant="small">Password</Text>
          <Input
            secureTextEntry
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {error ? (
          <Text variant="small" className="text-destructive">
            {error}
          </Text>
        ) : null}

        <Button onPress={handleLogin}>
          <Text>Log in</Text>
        </Button>

        <Pressable onPress={() => push('/signup')} className="items-center py-2">
          <Text variant="muted">
            Don&apos;t have an account? <Text className="text-foreground">Sign up</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
