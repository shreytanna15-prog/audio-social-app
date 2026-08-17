import { Tabs } from 'expo-router/js-tabs';
import { Image, StyleSheet, useColorScheme } from 'react-native';

import { Colors } from '@/core/theme';

const HOME_ICON = require('@/assets/images/tabIcons/home.png');
const AUDIO_ICON = require('@/assets/images/tabIcons/explore.png');

/**
 * Lives outside `src/app` on purpose: every file under the routes directory
 * becomes a route, and the JS tab bar renders a button for each one.
 *
 * JS tabs rather than `unstable-native-tabs`: the native Android tab container
 * re-attached its content view on a JS-driven pop from the nested Stack, which
 * crashed the Fabric mounting layer whenever the editor closed via Done.
 */
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: { backgroundColor: colors.background },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={HOME_ICON}
              style={[styles.icon, { width: size, height: size, tintColor: color }]}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="audio"
        options={{
          title: 'Audio',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={AUDIO_ICON}
              style={[styles.icon, { width: size, height: size, tintColor: color }]}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    resizeMode: 'contain',
  },
});
