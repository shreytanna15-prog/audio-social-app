import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { CURATED_PLAYLISTS, type CuratedPlaylist } from '../data/curated-playlists';
import { PlaylistCard } from './playlist-card';

type CuratedPlaylistsSectionProps = {
  playlists?: CuratedPlaylist[];
  onExplorePress?: () => void;
  onPlaylistPress?: (playlist: CuratedPlaylist) => void;
};

export function CuratedPlaylistsSection({
  playlists = CURATED_PLAYLISTS,
  onExplorePress,
  onPlaylistPress,
}: CuratedPlaylistsSectionProps) {
  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3 px-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text variant="title-lg" className="text-on-surface">
            Curated Playlists
          </Text>
          <Text variant="body-md" className="text-on-surface-variant">
            Engineered for deep focus and stem sampling
          </Text>
        </View>
        <Pressable
          onPress={onExplorePress}
          accessibilityRole="link"
          hitSlop={8}
          className="mt-0.5">
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            Explore
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
