import { Bell, MessageSquare } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/shared/components/brand/app-logo';
import { Text } from '@/shared/components/ui/text';
import { useAppChromeNav } from '@/shared/lib/use-app-chrome-nav';

const ICON_COLOR = '#F5F0FA';
const LOGO_WIDTH = 118;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (340 / 2020));

type AppHeaderProps = {
  showNotificationBadge?: boolean;
  avatarLabel?: string;
  transparent?: boolean;
  /** Defaults to safe chrome nav (no duplicate stack). */
  onNotificationsPress?: () => void;
  /** Defaults to safe chrome nav. Pass `false` to hide the chat icon. */
  onChatPress?: (() => void) | false;
  /** Defaults to safe chrome nav. */
  onAvatarPress?: () => void;
};

export function AppHeader({
  showNotificationBadge = false,
  avatarLabel = 'U',
  transparent = false,
  onNotificationsPress,
  onChatPress,
  onAvatarPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const chrome = useAppChromeNav();

  const handleNotifications = onNotificationsPress ?? chrome.openNotifications;
  const handleAvatar = onAvatarPress ?? chrome.openProfile;
  const showChat = onChatPress !== false;
  const handleChat =
    onChatPress === false ? undefined : (onChatPress ?? chrome.openChat);

  return (
    <View
      className={
        transparent
          ? 'border-b border-transparent bg-transparent px-4'
          : 'border-b border-white/5 bg-background px-4'
      }
      style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
      <View className="flex-row items-center justify-between">
        <AppLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />

        <View className="flex-row items-center gap-4">
          <Pressable
            onPress={handleNotifications}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            className="relative h-10 w-10 items-center justify-center">
            <Bell size={22} color={ICON_COLOR} strokeWidth={1.8} />
            {showNotificationBadge ? (
              <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#E8A0A0]" />
            ) : null}
          </Pressable>

          {showChat ? (
            <Pressable
              onPress={handleChat}
              accessibilityRole="button"
              accessibilityLabel="Messages"
              hitSlop={8}
              className="h-10 w-10 items-center justify-center">
              <MessageSquare size={22} color={ICON_COLOR} strokeWidth={1.8} />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}

          <Pressable
            onPress={handleAvatar}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            hitSlop={4}
            className="h-9 w-9 items-center justify-center rounded-full border border-white/25 p-0.5">
            <View className="h-full w-full items-center justify-center rounded-full bg-surface-container">
              <Text variant="label-sm" className="font-semibold text-on-surface">
                {avatarLabel.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
