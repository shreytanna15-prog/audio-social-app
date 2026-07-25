import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/features/audio/components/icon-button';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { shareRecording } from '@/features/audio/services/recording-share.service';
import { logRecorderMode } from '@/features/audio/domain/recorder-mode-log';
import { createLabel, formatDuration } from '@/features/audio/utils/format';
import { useRecordingsStore } from '@/features/audio/store';
import type { AudioRecording } from '@/features/audio/types/audio';

type RecordingCardProps = {
  recording: AudioRecording;
  index: number;
};

export function RecordingCard({ recording, index }: RecordingCardProps) {
  const router = useRouter();
  const deleteRecording = useRecordingsStore((state) => state.deleteRecording);
  const player = useAudioPlayer(recording.uri);
  const playerStatus = useAudioPlayerStatus(player);

  const createdLabel = useMemo(() => createLabel(recording.createdAt), [recording.createdAt]);

  const openEditor = () => {
    router.push({
      pathname: '/audio/recording/[id]',
      params: { id: recording.id },
    });
  };

  const handlePlay = () => {
    logRecorderMode('Play', null);

    if (playerStatus.playing) {
      player.pause();
      return;
    }

    player.seekTo(0);
    player.play();
  };

  const handleShare = () => {
    void shareRecording({
      uri: recording.uri,
      dialogTitle: `Recording ${index + 1}`,
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete recording?',
      'This recording will be permanently removed from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (playerStatus.playing) {
              player.pause();
            }

            void deleteRecording(recording.id);
          },
        },
      ],
    );
  };

  return (
    <Pressable onPress={openEditor} style={styles.card}>
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
              ios: playerStatus.playing ? 'pause.fill' : 'play.fill',
              android: playerStatus.playing ? 'pause' : 'play_arrow',
              web: playerStatus.playing ? 'pause' : 'play_arrow',
            }}
            size={20}
            style={styles.smallButton}
            onPress={handlePlay}
          />
          <IconButton
            icon={{
              ios: 'square.and.arrow.up',
              android: 'share',
              web: 'share',
            }}
            size={18}
            style={styles.smallButton}
            onPress={handleShare}
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
            onPress={handleDelete}
          />
        </View>
      </View>
      <WaveformDisplay height={48} bars={[0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.45, 0.75, 0.55, 0.65]} active={false} />
    </Pressable>
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

