import { Check } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { FEATURED_ARTISTS, type FeaturedArtist } from '../data/featured-artists';

type FeaturedArtistsSectionProps = {
  artists?: FeaturedArtist[];
  onSeeAllPress?: () => void;
  onArtistPress?: (artist: FeaturedArtist) => void;
};

function ArtistStory({
  artist,
  onPress,
}: {
  artist: FeaturedArtist;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={artist.name}
      className="w-22 items-center gap-2">
      <View className="relative">
        <View className="h-18 w-18 overflow-hidden rounded-full border border-white/10 bg-surface-container">
          <Image
            source={{ uri: artist.avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={artist.id}
          />
        </View>
        {artist.verified ? (
          <View className="absolute -bottom-0.5 -right-0.5 h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary-container">
            <Check size={10} color="#FFFFFF" strokeWidth={3} />
          </View>
        ) : null}
      </View>

      <Text
        variant="label-sm"
        className="text-center font-semibold text-on-surface"
        numberOfLines={1}>
        {artist.name}
      </Text>
      <View className="rounded-full bg-surface-container-high px-2 py-0.5">
        <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
          {artist.genre}
        </Text>
      </View>
    </Pressable>
  );
}

export function FeaturedArtistsSection({
  artists = FEATURED_ARTISTS,
  onSeeAllPress,
  onArtistPress,
}: FeaturedArtistsSectionProps) {
  return (
    <View className="gap-4">
      <View className="flex-row items-center justify-between px-4">
        <Text variant="title-lg" className="text-on-surface">
          Featured Artists
        </Text>
        <Pressable onPress={onSeeAllPress} accessibilityRole="link" hitSlop={8}>
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            See all
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
        {artists.map((artist) => (
          <ArtistStory
            key={artist.id}
            artist={artist}
            onPress={onArtistPress ? () => onArtistPress(artist) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}
