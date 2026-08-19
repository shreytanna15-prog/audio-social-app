import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  BAR_GAP_PX,
  BAR_WIDTH_PX,
  slotBarCount,
} from '@/features/audio/domain/timeline';

type StudioPeakWaveformProps = {
  peaks: number[];
  height: number;
  width: number;
  color: string;
  progress?: number;
  dimmed?: boolean;
  /** When false, keep source bar count (live meter) instead of filling the clip. */
  fillSlots?: boolean;
  /** Live rec: do not resample or grow a tail — bars stay where they were painted. */
  pinBars?: boolean;
};

function resamplePeaks(peaks: number[], count: number): number[] {
  if (count <= 0) {
    return [];
  }

  if (peaks.length === count) {
    return peaks;
  }

  if (peaks.length === 0) {
    return Array.from({ length: count }, () => 0.12);
  }

  if (peaks.length > count) {
    const out: number[] = [];
    const stride = peaks.length / count;

    for (let index = 0; index < count; index += 1) {
      const start = Math.floor(index * stride);
      const end = Math.max(start + 1, Math.floor((index + 1) * stride));
      let peak = 0;

      for (let cursor = start; cursor < end && cursor < peaks.length; cursor += 1) {
        peak = Math.max(peak, peaks[cursor] ?? 0);
      }

      out.push(peak);
    }

    return out;
  }

  const out: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const sourceIndex = Math.min(
      peaks.length - 1,
      Math.floor((index / count) * peaks.length),
    );
    out.push(peaks[sourceIndex] ?? 0);
  }

  return out;
}

function StudioPeakWaveformComponent({
  peaks,
  height,
  width,
  color,
  progress = 0,
  dimmed = false,
  fillSlots = true,
  pinBars = false,
}: StudioPeakWaveformProps) {
  const slots = slotBarCount(width);
  if (peaks.length === 0 || width <= 0 || (!pinBars && slots <= 0)) {
    return <View style={{ height, width }} />;
  }

  const bars = pinBars
    ? peaks
    : resamplePeaks(peaks, fillSlots ? slots : Math.min(peaks.length, slots));
  const clampedProgress = Math.min(1, Math.max(0, progress));

  if (bars.length === 0) {
    return <View style={{ height, width }} />;
  }

  return (
    <View style={[styles.row, { height, width }]}>
      {bars.map((level, index) => {
        const played = index / bars.length <= clampedProgress;
        return (
          <View
            key={`peak-${index}`}
            style={[
              styles.bar,
              {
                height: `${Math.max(8, level * 100)}%`,
                backgroundColor: color,
                opacity: dimmed ? 0.28 : played ? 0.95 : 0.4,
              },
            ]}
          />
        );
      })}
      {pinBars ? null : <View style={styles.quietLine} />}
    </View>
  );
}

export const StudioPeakWaveform = memo(StudioPeakWaveformComponent);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH_PX,
    marginRight: BAR_GAP_PX,
    borderRadius: 1,
    minHeight: 4,
  },
  quietLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#D7DDE5',
  },
});
