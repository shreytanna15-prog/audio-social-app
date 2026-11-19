import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/core/api';
import { useAuthStore } from '@/features/auth';
import { AnimatedSplashOverlay } from '@/shared/components/animated-icon';
import { NAV_THEME } from '@/shared/lib/theme';

export default function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={NAV_THEME.dark}>
            <StatusBar style="light" />
            <AnimatedSplashOverlay />
            {isHydrated ? (
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={isAuthenticated}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen
                    name="player"
                    options={{
                      presentation: 'fullScreenModal',
                      animation: 'slide_from_bottom',
                      gestureEnabled: true,
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="studio"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="projects"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="playlists"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="albums"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="notifications"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="listening-history"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                  <Stack.Screen
                    name="message"
                    options={{
                      headerShown: false,
                      animation: 'slide_from_right',
                    }}
                  />
                </Stack.Protected>

                <Stack.Protected guard={!isAuthenticated && !hasCompletedOnboarding}>
                  <Stack.Screen name="(onboarding)" />
                </Stack.Protected>

                <Stack.Protected guard={!isAuthenticated && hasCompletedOnboarding}>
                  <Stack.Screen name="(auth)" />
                </Stack.Protected>
              </Stack>
            ) : null}
            <PortalHost />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
