import { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { RecorderControls } from '@/features/audio/components/recorder-controls';
import { RecorderHeader } from '@/features/audio/components/recorder-header';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { useAudioSessionStore } from '@/features/audio/store';

export function RecorderSection() {
  const status = useAudioSessionStore((state) => state.status);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const meteringBars = useAudioSessionStore((state) => state.meteringBars);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const isPaused = useAudioSessionStore((state) => state.isPaused);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const importAudio = useAudioSessionStore((state) => state.importAudio);
  const handlePauseResume = useAudioSessionStore((state) => state.handlePauseResume);
  const resetSession = useAudioSessionStore((state) => state.resetSession);

  const handleMainPress = useCallback(() => {
    if (hasActiveSession) {
      void handleMainAction();
      return;
    }

    void startRecording();
  }, [hasActiveSession, handleMainAction, startRecording]);

  const isBusy = status === 'optimizing';
  const importDisabled = isBusy || hasActiveSession;

  return (
    <View style={styles.container}>
      <RecorderHeader title="Audio Recording" status={status} timerSeconds={timerSeconds} />
      <WaveformDisplay
        bars={meteringBars}
        active={status === 'recording'}
        height={140}
      />
      <RecorderControls
        isRecording={hasActiveSession}
        isPaused={isPaused}
        canReset={hasActiveSession}
        disabled={isBusy}
        onPauseResume={handlePauseResume}
        onMainAction={handleMainPress}
        onReset={resetSession}
      />

      <Pressable
        disabled={importDisabled}
        onPress={() => {
          void importAudio();
        }}
        style={({ pressed }) => [
          styles.importButton,
          importDisabled && styles.importDisabled,
          pressed && !importDisabled && styles.importPressed,
        ]}>
        <View style={styles.importIconWrap}>
          <SymbolView
            name={{
              ios: 'square.and.arrow.down',
              android: 'drive_folder_upload',
              web: 'drive_folder_upload',
            }}
            size={20}
            tintColor="#1A73E8"
          />
        </View>
        <View style={styles.importCopy}>
          <Text style={styles.importTitle}>Import audio</Text>
          <Text style={styles.importSubtitle}>WAV, M4A, MP3 from your files</Text>
        </View>
        <SymbolView
          name={{
            ios: 'chevron.right',
            android: 'chevron_right',
            web: 'chevron_right',
          }}
          size={16}
          tintColor="#9AA1A9"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 8,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 4,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E9EE',
  },
  importDisabled: {
    opacity: 0.45,
  },
  importPressed: {
    opacity: 0.88,
    backgroundColor: '#F7F9FC',
  },
  importIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAF2FD',
  },
  importCopy: {
    flex: 1,
    gap: 2,
  },
  importTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D21',
  },
  importSubtitle: {
    fontSize: 12,
    color: '#7A7F87',
  },
});
