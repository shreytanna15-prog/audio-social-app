import { StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/module/audio/components/icon-button';
import { WaveformDisplay } from '@/module/audio/components/waveform-display';
import { formatDuration } from '@/module/audio/utils/format-duration';
import type { AudioRecording } from '@/types/audio';

type RecordingCardProps = {
  recording: AudioRecording;
  index: number;
};

export function RecordingCard({ recording, index }: RecordingCardProps) {
  const createdLabel = new Date(recording.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Recording {index + 1}</Text>
          <Text style={styles.meta}>
            {formatDuration(recording.duration)} · {recording.type} · {createdLabel}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon={{
              ios: 'play.fill',
              android: 'play_arrow',
              web: 'play_arrow',
            }}
            size={20}
            style={styles.smallButton}
          />
          <IconButton
            icon={{
              ios: 'square.and.arrow.up',
              android: 'share',
              web: 'share',
            }}
            size={18}
            style={styles.smallButton}
          />
          <IconButton
            icon={{
              ios: 'trash',
              android: 'delete',
              web: 'delete',
            }}
            size={18}
            variant="danger"
            style={styles.smallButton}
          />
        </View>
      </View>
      <WaveformDisplay height={48} bars={[0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.45, 0.75, 0.55, 0.65]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E3E7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D21',
  },
  meta: {
    marginTop: 4,
    fontSize: 12,
    color: '#7A7F87',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
