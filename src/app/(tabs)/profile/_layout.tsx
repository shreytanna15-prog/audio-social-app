import { Stack } from 'expo-router';

export default function ProfileTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="followers" options={{ title: 'Followers' }} />
      <Stack.Screen name="following" options={{ title: 'Following' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen
        name="settings/genres"
        options={{ title: 'Preferred genres' }}
      />
      <Stack.Screen
        name="settings/notifications"
        options={{ title: 'Notifications' }}
      />
    </Stack>
  );
}
