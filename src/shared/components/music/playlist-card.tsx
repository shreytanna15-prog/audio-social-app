import { Image } from 'expo-image';
import { ListMusic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import type { CuratedPlaylist } from '@/shared/data/curated-playlists';

const CARD_WIDTH = 168;
const COVER_SIZE = 168;

type PlaylistCardProps = {
  playlist: CuratedPlaylist;
  onPress?: () => void;
};

export function PlaylistCard({ playlist, onPress }: PlaylistCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${playlist.title}, curated by ${playlist.curator}`}
      className="gap-2.5"
      style={{ width: CARD_WIDTH }}>
      <View
        className="relative overflow-hidden rounded-2xl bg-surface-container"
        style={{ width: COVER_SIZE, height: COVER_SIZE }}>
        <Image
          source={{ uri: playlist.coverUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          recyclingKey={playlist.id}
        />

        <View className="absolute bottom-2.5 left-2.5 flex-row items-center gap-1.5 rounded-full bg-black/60 px-2 py-1">
          <ListMusic size={12} color="#D0BCFF" strokeWidth={2} />
          <Text variant="caption" className="font-medium text-primary-tonal">
            {playlist.trackCount} Tracks
          </Text>
        </View>
      </View>

      <View className="gap-0.5 px-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {playlist.title}
        </Text>
        <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
          {playlist.curator}
        </Text>
      </View>
    </Pressable>
  );
}
