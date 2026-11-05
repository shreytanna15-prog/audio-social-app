import { Image } from 'expo-image';
import { User, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

const ICON_REMOVE = '#958EA0';
const TITLE = '#E4E1EA';
const SUBTITLE = '#958EA0';

type SearchArtistRowProps = {
  name: string | null;
  username: string;
  avatarUrl?: string | null;
  onPress: () => void;
  onRemove?: () => void;
};

function initialFrom(name: string | null, username: string): string {
  const source = (name?.trim() || username).trim();
  return source.charAt(0).toUpperCase() || '?';
}

/** Artist hit row — same density as SearchRecentRow (Figma Search). */
export function SearchArtistRow({
  name,
  username,
  avatarUrl,
  onPress,
  onRemove,
}: SearchArtistRowProps) {
  const title = name?.trim() || `@${username}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${title}`}
      className="flex-row items-center gap-3 px-4 py-2.5 active:opacity-90">
      {avatarUrl ? (
        <View className="h-12 w-12 overflow-hidden rounded-full bg-surface-container-high">
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={`${username}-search`}
          />
        </View>
      ) : (
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-tonal">
          <Text variant="title-md" className="text-on-primary">
            {initialFrom(name, username)}
          </Text>
        </View>
      )}

      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" style={{ color: TITLE }} numberOfLines={1}>
          {title}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <User size={13} color="#CCBEFF" strokeWidth={2} />
          <Text
            variant="label-md"
            className="shrink font-normal"
            style={{ color: SUBTITLE }}
            numberOfLines={1}>
            Artist
          </Text>
        </View>
      </View>

      {onRemove ? (
        <Pressable
          onPress={(event) => {
            event.stopPropagation?.();
            onRemove();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${title}`}
          hitSlop={10}
          className="h-9 w-9 items-center justify-center">
          <X size={18} color={ICON_REMOVE} strokeWidth={2} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}
