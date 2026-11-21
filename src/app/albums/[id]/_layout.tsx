import { Stack } from 'expo-router';

export default function AlbumIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Album' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit album' }} />
    </Stack>
  );
}
