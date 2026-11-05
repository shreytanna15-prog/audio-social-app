import { Stack } from 'expo-router';

/**
 * Chat tab stack: Messages list + Requests (tab bar stays visible).
 * Individual conversations live under `/message/[id]` (root stack).
 */
export default function ChatTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Chat' }} />
      <Stack.Screen name="requests" options={{ title: 'Requests' }} />
    </Stack>
  );
}
