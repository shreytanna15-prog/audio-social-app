import { ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import {
  CURATED_PLAYLISTS,
  type CuratedPlaylist,
} from '@/shared/data/curated-playlists';

import { PlaylistCard } from './playlist-card';

type CuratedPlaylistsSectionProps = {
  title?: string;
  playlists?: CuratedPlaylist[];
  onPlaylistPress?: (playlist: CuratedPlaylist) => void;
};

export function CuratedPlaylistsSection({
  title = 'Playlists',
  playlists = CURATED_PLAYLISTS,
  onPlaylistPress,
}: CuratedPlaylistsSectionProps) {
  return (
    <View className="gap-4">
      <View className="px-4">
        <Text variant="title-lg" className="text-on-surface">
          {title}
        </Text>
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
