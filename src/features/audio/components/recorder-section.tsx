import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { RecorderControls } from '@/features/audio/components/recorder-controls';
import { RecorderHeader } from '@/features/audio/components/recorder-header';
import { RecordingModePicker } from '@/features/audio/components/recording-mode-picker';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import type { RecordingMode } from '@/features/audio/types/recording-mode';
import { useAudioSessionStore } from '@/features/audio/store';

export function RecorderSection() {
  const [isModePickerVisible, setIsModePickerVisible] = useState(false);
  const status = useAudioSessionStore((state) => state.status);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const meteringBars = useAudioSessionStore((state) => state.meteringBars);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const isPaused = useAudioSessionStore((state) => state.isPaused);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const handlePauseResume = useAudioSessionStore((state) => state.handlePauseResume);
  const resetSession = useAudioSessionStore((state) => state.resetSession);

  const handleMainPress = useCallback(() => {
    if (hasActiveSession) {
      void handleMainAction();
      return;
    }

    setIsModePickerVisible(true);
  }, [hasActiveSession, handleMainAction]);

  const handleModeSelect = useCallback(
    (mode: RecordingMode) => {
      setIsModePickerVisible(false);
      void startRecording(mode);
    },
    [startRecording],
  );

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
        disabled={status === 'optimizing'}
        onPauseResume={handlePauseResume}
        onMainAction={handleMainPress}
        onReset={resetSession}
      />
      <RecordingModePicker
        visible={isModePickerVisible}
        onClose={() => setIsModePickerVisible(false)}
        onSelect={handleModeSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
});
