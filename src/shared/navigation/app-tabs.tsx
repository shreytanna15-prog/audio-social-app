import { Tabs } from 'expo-router/js-tabs';

import { AppTabBar } from '@/shared/navigation/app-tab-bar';

/**
 * Lives outside `src/app` on purpose: every file under the routes directory
 * becomes a route, and the JS tab bar renders a button for each one.
 *
 * JS tabs rather than `unstable-native-tabs`: the native Android tab container
 * re-attached its content view on a JS-driven pop from the nested Stack, which
 * crashed the Fabric mounting layer whenever the editor closed via Done.
 */
export default function AppTabs() {
  return (
    <Tabs
      backBehavior="history"
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="feed" options={{ title: 'Feed' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      {/* Chat / Library — open from header / Profile Library */}
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
          title: 'Chat',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          href: null,
          title: 'Library',
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          href: null,
          title: 'Audio',
        }}
      />
      <Tabs.Screen
        name="artist"
        options={{
          href: null,
          title: 'Artist',
        }}
      />
    </Tabs>
  );
}
