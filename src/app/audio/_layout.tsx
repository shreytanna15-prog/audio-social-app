import { Stack } from 'expo-router';

import { useRecordingsHydration } from '@/features/audio/hooks/use-recordings-hydration';

/**
 * Without an anchor, landing on `recording/[id]` directly — which every dev
 * reload does, since the URL is preserved — builds a stack whose only entry is
 * the editor, leaving nothing to go back to.
 */
export const unstable_settings = {
  anchor: 'index',
};

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
