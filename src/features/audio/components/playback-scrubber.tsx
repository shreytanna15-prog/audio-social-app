import Slider from '@react-native-community/slider';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/features/audio/utils/format';

type PlaybackScrubberProps = {
  currentTime: number;
  duration: number;
  disabled?: boolean;
  onSeek: (seconds: number) => void;
  onReplayFromHere: () => void;
};

export function PlaybackScrubber({
  currentTime,
  duration,
  disabled = false,
  onSeek,
  onReplayFromHere,
}: PlaybackScrubberProps) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const max = duration > 0 ? duration : 1;
  const displayTime = isScrubbing ? scrubValue : currentTime;

  return (
    <View style={[styles.container, disabled && styles.disabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatDuration(displayTime)}</Text>
        <Text style={styles.time}>{formatDuration(duration)}</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={max}
        value={clampDisplay(displayTime, max)}
        disabled={disabled || duration <= 0}
        minimumTrackTintColor="#1A73E8"
        maximumTrackTintColor="#D0D4DA"
        thumbTintColor="#1A73E8"
        onSlidingStart={(value) => {
          setIsScrubbing(true);
          setScrubValue(value);
        }}
        onValueChange={(value) => {
          if (isScrubbing) {
            setScrubValue(value);
          }
        }}
        onSlidingComplete={(value) => {
          setIsScrubbing(false);
          setScrubValue(value);
          onSeek(value);
        }}
      />
      <Pressable
        style={[styles.replayButton, disabled && styles.buttonDisabled]}
        disabled={disabled}
        onPress={onReplayFromHere}>
        <Text style={styles.replayButtonText}>Play from here again</Text>
      </Pressable>
      <Text style={styles.hint}>Drag to a line, then tap the button to hear that part on loop for A/B.</Text>
    </View>
  );
}

function clampDisplay(value: number, max: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > max) {
    return max;
  }
  return value;
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    paddingHorizontal: 4,
  },
  disabled: {
    opacity: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: '#7A7F87',
  },
  slider: {
    width: '100%',
    height: 36,
  },
  replayButton: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#E8F0FE',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  replayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A73E8',
  },
  hint: {
    fontSize: 12,
    color: '#9AA0A6',
    textAlign: 'center',
  },
});
