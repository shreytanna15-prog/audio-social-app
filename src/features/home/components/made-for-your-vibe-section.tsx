import { ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { VibeTrack } from '../data/made-for-your-vibe';
import { VibeTrackCard } from './vibe-track-card';

export type { VibeTrack, VibeTrackTagTone } from '../data/made-for-your-vibe';

type MadeForYourVibeSectionProps = {
  tracks: VibeTrack[];
  onTrackPress?: (track: VibeTrack) => void;
  onPlayPress?: (track: VibeTrack) => void;
};

export function MadeForYourVibeSection({
  tracks,
  onTrackPress,
  onPlayPress,
}: MadeForYourVibeSectionProps) {
  if (tracks.length === 0) {
    return null;
  }

  return (
    <View className="gap-4">
      <View className="px-4">
        <Text variant="title-lg" className="text-on-surface">
          Made for your vibe
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
        {tracks.map((track) => (
          <VibeTrackCard
            key={track.id}
            track={track}
            onPress={onTrackPress ? () => onTrackPress(track) : undefined}
            onPlayPress={onPlayPress ? () => onPlayPress(track) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}
