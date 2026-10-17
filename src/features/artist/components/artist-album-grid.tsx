import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { ArtistAlbum } from '../types';

type ArtistAlbumGridProps = {
  albums: ArtistAlbum[];
  onAlbumPress: (album: ArtistAlbum) => void;
};

export function ArtistAlbumGrid({ albums, onAlbumPress }: ArtistAlbumGridProps) {
  return (
    <View className="flex-row flex-wrap gap-y-4 px-4 pt-1">
      {albums.map((album) => (
        <Pressable
          key={album.id}
          onPress={() => onAlbumPress(album)}
          accessibilityRole="button"
          accessibilityLabel={`${album.title}, ${album.yearLabel}, ${album.trackCount} tracks`}
          className="w-1/2 gap-2 px-1.5">
          <View className="aspect-square overflow-hidden rounded-2xl bg-surface-container">
            <Image
              source={{ uri: album.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={album.id}
            />
          </View>
          <View className="gap-0.5 px-0.5">
            <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
              {album.title}
            </Text>
            <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
              {album.yearLabel} • {album.trackCount} tracks
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
