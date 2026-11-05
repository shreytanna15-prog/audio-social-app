import { Image } from 'expo-image';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type ParticipantAvatarProps = {
  id: string;
  name: string;
  avatarUrl: string | null;
  size: number;
  recyclingKey?: string;
  border?: boolean;
};

export function ParticipantAvatar({
  id,
  name,
  avatarUrl,
  size,
  recyclingKey,
  border = true,
}: ParticipantAvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          ...(border
            ? {
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.22)',
              }
            : null),
        }}
        contentFit="cover"
        recyclingKey={recyclingKey ?? id}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-primary-tonal"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        ...(border
          ? {
              borderWidth: 1.5,
              borderColor: 'rgba(255, 255, 255, 0.22)',
            }
          : null),
      }}>
      <Text
        className="font-sans font-semibold text-on-primary"
        style={{ fontSize: Math.round(size * 0.38) }}>
        {initial}
      </Text>
    </View>
  );
}
