import { Image } from 'expo-image';
import { ListMusic } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ProfilePlaylist } from '../types';

type ProfilePlaylistListProps = {
  playlists: ProfilePlaylist[];
  onPlaylistPress: (playlist: ProfilePlaylist) => void;
};

export function ProfilePlaylistList({
  playlists,
  onPlaylistPress,
}: ProfilePlaylistListProps) {
  return (
    <View className="gap-2 px-4 pt-1">
      {playlists.map((playlist) => (
        <Pressable
          key={playlist.id}
          onPress={() => onPlaylistPress(playlist)}
          accessibilityRole="button"
          accessibilityLabel={`${playlist.title}, ${playlist.trackCount} tracks`}
          className="flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
          <View className="h-14 w-14 overflow-hidden rounded-xl bg-surface-container-high">
            <Image
              source={{ uri: playlist.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={playlist.id}
            />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
              {playlist.title}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <ListMusic size={12} color="#D0BCFF" strokeWidth={2} />
              <Text variant="caption" className="text-on-surface-variant">
                {playlist.trackCount} tracks
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
