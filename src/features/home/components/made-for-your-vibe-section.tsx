import { Sparkles } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { MADE_FOR_YOUR_VIBE, type VibeTrack } from '../data/made-for-your-vibe';
import { VibeTrackCard } from './vibe-track-card';

type MadeForYourVibeSectionProps = {
  tracks?: VibeTrack[];
  onTrackPress?: (track: VibeTrack) => void;
  onPlayPress?: (track: VibeTrack) => void;
};

export function MadeForYourVibeSection({
  tracks = MADE_FOR_YOUR_VIBE,
  onTrackPress,
  onPlayPress,
}: MadeForYourVibeSectionProps) {
  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3 px-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text variant="title-lg" className="text-on-surface">
            Made For Your Vibe
          </Text>
          <Text variant="body-md" className="text-on-surface-variant">
            Based on your late-night session stems.
          </Text>
        </View>
        <View className="mt-0.5 h-9 w-9 items-center justify-center">
          <Sparkles size={20} color="#D0BCFF" strokeWidth={2} />
        </View>
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
