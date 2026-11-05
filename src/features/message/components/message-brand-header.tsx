import { Bell, User } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLogo } from '@/shared/components/brand/app-logo';

const ICON_COLOR = '#F5F0FA';
const LOGO_WIDTH = 118;
const LOGO_HEIGHT = Math.round(LOGO_WIDTH * (340 / 2020));

type MessageBrandHeaderProps = {
  showNotificationBadge?: boolean;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
};

/**
 * Chat tab chrome: AppLogo (replaces design “CHAT” wordmark) + bell + avatar.
 */
export function MessageBrandHeader({
  showNotificationBadge = false,
  onNotificationsPress,
  onAvatarPress,
}: MessageBrandHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-b border-white/5 bg-background px-4"
      style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}>
      <View className="flex-row items-center justify-between">
        <AppLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />

        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={onNotificationsPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            hitSlop={8}
            className="relative h-10 w-10 items-center justify-center">
            <Bell size={22} color={ICON_COLOR} strokeWidth={1.8} />
            {showNotificationBadge ? (
              <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-[#E8A0A0]" />
            ) : null}
          </Pressable>

          <Pressable
            onPress={onAvatarPress}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            hitSlop={4}
            className="h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#3B2A55]">
            <User size={18} color="#E4E1EA" strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
