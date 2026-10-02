import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import {
  CURATED_PLAYLISTS,
  type CuratedPlaylist,
} from '@/shared/data/curated-playlists';

import { PlaylistCard } from './playlist-card';

type CuratedPlaylistsSectionProps = {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  playlists?: CuratedPlaylist[];
  onActionPress?: () => void;
  onPlaylistPress?: (playlist: CuratedPlaylist) => void;
};

export function CuratedPlaylistsSection({
  title = 'Curated Playlists',
  subtitle = 'Engineered for deep focus and stem sampling',
  actionLabel = 'See All',
  playlists = CURATED_PLAYLISTS,
  onActionPress,
  onPlaylistPress,
}: CuratedPlaylistsSectionProps) {
  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3 px-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text variant="title-lg" className="text-on-surface">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body-md" className="text-on-surface-variant">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onActionPress}
          accessibilityRole="link"
          hitSlop={8}
          className="mt-0.5">
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            {actionLabel}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
        {playlists.map((playlist) => (
          <PlaylistCard
            key={playlist.id}
            playlist={playlist}
            onPress={onPlaylistPress ? () => onPlaylistPress(playlist) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}
