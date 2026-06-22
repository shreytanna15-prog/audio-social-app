import { StyleSheet, Text, View } from 'react-native';

import { RecordingTimer } from '@/module/audio/components/recording-timer';

type RecorderHeaderProps = {
  title: string;
  status: 'idle' | 'recording' | 'paused' | 'preview';
  timerSeconds: number;
};

const STATUS_LABEL: Record<RecorderHeaderProps['status'], string> = {
  idle: 'Ready to record',
  recording: 'Recording',
  paused: 'Paused',
  preview: 'Preview',
};

export function RecorderHeader({ title, status, timerSeconds }: RecorderHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.status, status === 'recording' && styles.statusActive]}>
        {STATUS_LABEL[status]}
      </Text>
      <RecordingTimer seconds={timerSeconds} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D21',
  },
  status: {
    fontSize: 13,
    color: '#7A7F87',
  },
  statusActive: {
    color: '#E53935',
    fontWeight: '600',
  },
});
