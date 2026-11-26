import { Stack } from 'expo-router';

import { usePauseGlobalPlayerOnFocus } from '@/features/player';

export default function StudioLayout() {
  usePauseGlobalPlayerOnFocus();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="quick-record" />
      <Stack.Screen name="multitrack" />
      <Stack.Screen name="import-audio" />
      <Stack.Screen name="import-audio/edit" />
      <Stack.Screen name="create-feed-clip" />
    </Stack>
  );
}
