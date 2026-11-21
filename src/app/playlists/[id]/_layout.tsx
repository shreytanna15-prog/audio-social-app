import { Stack } from 'expo-router';

export default function PlaylistIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Playlist' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit playlist' }} />
    </Stack>
  );
}
