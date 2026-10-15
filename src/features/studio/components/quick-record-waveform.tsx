import { StyleSheet, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

const TIMELINE = ['0s', '5s', '10s', '15s', '20s', '25s'];
/** Same waveform height as the original card design. */
const WAVE_HEIGHT = 140;
const EMPTY_BAR_COUNT = 56;
const BAR_WIDTH = 3;

export function QuickRecordTimeline() {
  return (
    <View className="flex-row justify-between px-1 pt-1">
      {TIMELINE.map((label) => (
        <Text key={label} variant="caption" className="text-slate-muted">
          {label}
        </Text>
      ))}
    </View>
  );
}

/**
 * Empty first-visit waveform — quiet baseline + playhead at the start.
 * Wave bars keep a fixed height (centered). Playhead spans the middle region.
 */
export function QuickRecordWaveform() {
  return (
    <View className="relative flex-1 justify-center">
      <View style={[styles.row, { height: WAVE_HEIGHT }]}>
        {Array.from({ length: EMPTY_BAR_COUNT }, (_, index) => (
          <View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                height: 4,
                backgroundColor: '#3A3648',
                opacity: 0.55,
              },
            ]}
          />
        ))}
      </View>

      {/* Playhead at start — full height of the middle region */}
      <View style={styles.playhead} pointerEvents="none">
        <View style={styles.playheadKnob} />
        <View style={styles.playheadLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
  },
  playhead: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 12,
    alignItems: 'center',
  },
  playheadKnob: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 10px rgba(160, 120, 255, 0.55)',
  },
  playheadLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#A078FF',
    boxShadow: '0 0 8px rgba(160, 120, 255, 0.45)',
  },
});
