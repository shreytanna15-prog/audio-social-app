import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type PlayerProgressProps = {
  progress: number;
  durationSec: number;
  onSeek: (progress: number) => void;
};

function formatPlayerTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function PlayerProgress({ progress, durationSec, onSeek }: PlayerProgressProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(progress);

  const displayProgress = isScrubbing ? scrubProgress : progress;
  const currentSec = displayProgress * durationSec;

  return (
    <View className="gap-1">
      <Slider
        style={{ width: '100%', height: 36 }}
        minimumValue={0}
        maximumValue={1}
        value={displayProgress}
        minimumTrackTintColor="#D0BCFF"
        maximumTrackTintColor="#34343B"
        thumbTintColor="#FFFFFF"
        onSlidingStart={(value) => {
          setIsScrubbing(true);
          setScrubProgress(value);
        }}
        onValueChange={(value) => {
          if (isScrubbing) setScrubProgress(value);
        }}
        onSlidingComplete={(value) => {
          setIsScrubbing(false);
          setScrubProgress(value);
          onSeek(value);
        }}
      />
      <View className="flex-row items-center justify-between px-0.5">
        <Text
          variant="caption"
          className="text-on-surface-variant"
          style={{ fontVariant: ['tabular-nums'] }}>
          {formatPlayerTime(currentSec)}
        </Text>
        <Text
          variant="caption"
          className="text-on-surface-variant"
          style={{ fontVariant: ['tabular-nums'] }}>
          {formatPlayerTime(durationSec)}
        </Text>
      </View>
    </View>
  );
}
