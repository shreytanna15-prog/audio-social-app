import { Stack } from 'expo-router';

import { useRecordingsHydration } from '@/module/audio/hooks/use-recordings-hydration';

export default function AudioLayout() {
  useRecordingsHydration();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="recording/[id]"
        options={{
          title: 'Recording',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
