import { Stack } from 'expo-router';

import { usePauseGlobalPlayerOnFocus } from '@/features/player';

/**
 * Nested stack for /projects and /projects/[id].
 * Keep screen names explicit so Expo Router does not double-register.
 */
export default function ProjectsLayout() {
  usePauseGlobalPlayerOnFocus();

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Projects' }} />
      <Stack.Screen name="[id]" options={{ title: 'Project' }} />
    </Stack>
  );
}
