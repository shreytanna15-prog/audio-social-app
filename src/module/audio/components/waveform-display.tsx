import { StyleSheet, View } from 'react-native';

const DEFAULT_BARS = [0.2, 0.45, 0.7, 0.55, 0.9, 0.35, 0.6, 0.8, 0.5, 0.75, 0.4, 0.65, 0.3, 0.85, 0.5, 0.7, 0.45, 0.6, 0.35, 0.55];

type WaveformDisplayProps = {
  bars: number[];
  active: boolean;
  height: number;
};

export function WaveformDisplay({
  bars = DEFAULT_BARS,
  active = false,
  height = 120,
}: WaveformDisplayProps) {
  return (
    <View style={[styles.container, { height }]}>
      {bars.map((level, index) => (
        <View
          key={`bar-${index}`}
          style={[
            styles.bar,
            {
              height: `${Math.max(12, level * 100)}%`,
              backgroundColor: active ? '#E53935' : '#9AA0A6',
              opacity: active ? 0.85 + (index % 3) * 0.05 : 0.55,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F4F5F7',
  },
  bar: {
    width: 4,
    borderRadius: 2,
    minHeight: 8,
  },
});
