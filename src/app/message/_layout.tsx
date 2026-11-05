import { Stack } from 'expo-router';

/**
 * Conversation threads outside tabs so the tab bar is hidden.
 */
export default function MessageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="[id]" options={{ title: 'Conversation' }} />
    </Stack>
  );
}
