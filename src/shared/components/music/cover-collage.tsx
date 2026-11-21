import { Image } from 'expo-image';
import { View } from 'react-native';

type CoverCollageProps = {
  urls: string[];
  recyclingKey?: string;
};

const GAP = 1;

function Tile({
  uri,
  recyclingKey,
}: {
  uri: string;
  recyclingKey?: string;
}) {
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      recyclingKey={recyclingKey}
      transition={160}
    />
  );
}

/** Spotify-ish 1 / 2×1 / L / 2×2 collage from up to 4 track cover URLs. */
export function CoverCollage({ urls, recyclingKey }: CoverCollageProps) {
  const tiles = urls.filter(Boolean).slice(0, 4);

  if (tiles.length === 0) {
    return <View className="h-full w-full bg-surface-container-highest" />;
  }

  if (tiles.length === 1) {
    return (
      <View className="h-full w-full">
        <Tile uri={tiles[0]} recyclingKey={recyclingKey} />
      </View>
    );
  }

  if (tiles.length === 2) {
    return (
      <View className="h-full w-full flex-row" style={{ gap: GAP }}>
        {tiles.map((uri, index) => (
          <View key={`${recyclingKey ?? 'cover'}-${index}`} className="flex-1">
            <Tile uri={uri} recyclingKey={`${recyclingKey ?? 'cover'}-${index}`} />
          </View>
        ))}
      </View>
    );
  }

  if (tiles.length === 3) {
    return (
      <View className="h-full w-full flex-row" style={{ gap: GAP }}>
        <View className="flex-1">
          <Tile uri={tiles[0]} recyclingKey={`${recyclingKey ?? 'cover'}-0`} />
        </View>
        <View className="flex-1" style={{ gap: GAP }}>
          <View className="flex-1">
            <Tile uri={tiles[1]} recyclingKey={`${recyclingKey ?? 'cover'}-1`} />
          </View>
          <View className="flex-1">
            <Tile uri={tiles[2]} recyclingKey={`${recyclingKey ?? 'cover'}-2`} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="h-full w-full" style={{ gap: GAP }}>
      <View className="flex-1 flex-row" style={{ gap: GAP }}>
        <View className="flex-1">
          <Tile uri={tiles[0]} recyclingKey={`${recyclingKey ?? 'cover'}-0`} />
        </View>
        <View className="flex-1">
          <Tile uri={tiles[1]} recyclingKey={`${recyclingKey ?? 'cover'}-1`} />
        </View>
      </View>
      <View className="flex-1 flex-row" style={{ gap: GAP }}>
        <View className="flex-1">
          <Tile uri={tiles[2]} recyclingKey={`${recyclingKey ?? 'cover'}-2`} />
        </View>
        <View className="flex-1">
          <Tile uri={tiles[3]} recyclingKey={`${recyclingKey ?? 'cover'}-3`} />
        </View>
      </View>
    </View>
  );
}
