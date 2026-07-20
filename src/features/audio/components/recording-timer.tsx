import { StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '@/features/audio/utils/format';

type RecordingTimerProps = {
  seconds: number;
  label?: string;
};

export function RecordingTimer({ seconds, label }: RecordingTimerProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Text style={styles.time}>{formatDuration(seconds)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#7A7F87',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 32,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: '#1A1D21',
  },
});
