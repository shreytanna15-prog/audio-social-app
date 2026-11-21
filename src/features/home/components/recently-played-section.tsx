import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { RecentlyPlayedTrack } from '../data/recently-played';
import { RecentlyPlayedTile } from './recently-played-tile';

type RecentlyPlayedSectionProps = {
  tracks: RecentlyPlayedTrack[];
  onTrackPress?: (track: RecentlyPlayedTrack) => void;
};

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

export function RecentlyPlayedSection({
  tracks,
  onTrackPress,
}: RecentlyPlayedSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  const rows = chunkPairs(tracks);

  return (
    <View className="gap-4 px-4">
      <Text variant="title-lg" className="text-on-surface" numberOfLines={1}>
        Recently played
      </Text>

      <View className="gap-2.5">
        {rows.map((row) => (
          <View key={row.map((track) => track.id).join('-')} className="flex-row gap-2.5">
            {row.map((track) => (
              <RecentlyPlayedTile
                key={track.id}
                track={track}
                onPress={onTrackPress ? () => onTrackPress(track) : undefined}
              />
            ))}
            {row.length === 1 ? <View className="min-w-0 flex-1" /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
