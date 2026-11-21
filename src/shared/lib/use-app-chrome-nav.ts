import { type Href, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';

import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

function pathOf(pathname: string | null): string {
  return pathname ?? '';
}

function isNotificationsRoute(pathname: string | null): boolean {
  return /(^|\/)notifications\/?$/.test(pathOf(pathname));
}

function isChatIndexRoute(pathname: string | null): boolean {
  const path = pathOf(pathname);
  return /(^|\/)chat\/?$/.test(path);
}

function isChatRequestsRoute(pathname: string | null): boolean {
  return pathOf(pathname).includes('/chat/requests');
}

function isProfileRoute(pathname: string | null): boolean {
  const path = pathOf(pathname);
  return /(^|\/)profile(?:\/edit)?\/?$/.test(path);
}

/**
 * Safe destinations for AppHeader chrome (bell / chat / avatar).
 * Skips duplicate pushes when already on that surface.
 */
export function useAppChromeNav() {
  const pathname = usePathname();
  const { navigate, replace } = useRouter();
  const { guard } = useNavigationGuard();

  const openNotifications = useCallback(() => {
    guard(() => {
      if (isNotificationsRoute(pathname)) return;
      navigate('/notifications' as Href);
    });
  }, [guard, navigate, pathname]);

  const openChat = useCallback(() => {
    guard(() => {
      if (isChatIndexRoute(pathname)) return;
      if (isChatRequestsRoute(pathname)) {
        replace('/(tabs)/chat' as Href);
        return;
      }
      navigate('/(tabs)/chat' as Href);
    });
  }, [guard, navigate, pathname, replace]);

  const openProfile = useCallback(() => {
    guard(() => {
      if (isProfileRoute(pathname) && !pathOf(pathname).includes('/edit')) {
        return;
      }
      navigate('/(tabs)/profile' as Href);
    });
  }, [guard, navigate, pathname]);

  return {
    openNotifications,
    openChat,
    openProfile,
    isOnChatIndex: isChatIndexRoute(pathname),
    isOnNotifications: isNotificationsRoute(pathname),
    isOnProfile: isProfileRoute(pathname),
  };
}
