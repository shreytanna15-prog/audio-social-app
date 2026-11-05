import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/features/audio/components/icon-button';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { fromStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import { shareRecording } from '@/features/audio/services/recording-share.service';
import { logRecorderMode } from '@/features/audio/domain/recorder-mode-log';
import { createLabel, formatDuration } from '@/features/audio/utils/format';
import { getEditChainLabel } from '@/features/audio/types/edit-chips';
import { useRecordingsStore } from '@/features/audio/store';
import type { AudioRecording } from '@/features/audio/types/audio';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';

type RecordingCardProps = {
  recording: AudioRecording;
  index: number;
  onOpen: (recordingId: string) => void;
};

export function RecordingCard({ recording, index, onOpen }: RecordingCardProps) {
  const deleteRecording = useRecordingsStore((state) => state.deleteRecording);
  const player = useAudioPlayer(recording.uri);
  const playerStatus = useAudioPlayerStatus(player);
  const { confirm, dialog } = useFeedbackDialog();

  // Re-saving rewrites original.* in place, so the player would keep serving the
  // audio it loaded first. The row is not remounted, so this ref can tell an
  // actual re-save apart from the initial mount.
  const loadedRevisionRef = useRef(recording.updatedAt);

  useEffect(() => {
    if (loadedRevisionRef.current === recording.updatedAt) {
      return;
    }

    loadedRevisionRef.current = recording.updatedAt;
    player.replace(recording.uri);
  }, [player, recording.updatedAt, recording.uri]);

  const createdLabel = useMemo(() => createLabel(recording.createdAt), [recording.createdAt]);
  const effectLabel = useMemo(() => {
    if (!recording.editChain) {
      return null;
    }

    return getEditChainLabel(fromStoredEditChain(recording.editChain));
  }, [recording.editChain]);

  const openEditor = () => {
    onOpen(recording.id);
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
    confirm(
      'Delete recording?',
      'This recording will be permanently removed from your device.',
      {
        confirmLabel: 'Delete',
        destructive: true,
        onConfirm: () => {
          if (playerStatus.playing) {
            player.pause();
          }

          void deleteRecording(recording.id);
        },
      },
    );
  };

  return (
    <>
      <Pressable onPress={openEditor} style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Recording {index + 1}</Text>
            <Text style={styles.meta}>
              {formatDuration(recording.duration)} · {recording.type} ·{' '}
              {createdLabel}
            </Text>
            {effectLabel ? (
              <Text style={styles.effects}>{effectLabel}</Text>
            ) : null}
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
        <WaveformDisplay
          height={48}
          bars={[0.3, 0.5, 0.7, 0.4, 0.8, 0.6, 0.45, 0.75, 0.55, 0.65]}
          active={false}
        />
      </Pressable>
      {dialog}
    </>
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
  effects: {
    marginTop: 4,
    fontSize: 12,
    color: '#1A73E8',
    fontWeight: '500',
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

