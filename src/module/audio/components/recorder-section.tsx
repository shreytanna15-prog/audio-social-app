import { StyleSheet, View } from 'react-native';

import { RecorderControls, RecorderHeader, WaveformDisplay } from '@/module/audio/components';
import { useAudioSessionStore } from '@/store';

export function RecorderSection() {
  const status = useAudioSessionStore((state) => state.status);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const meteringBars = useAudioSessionStore((state) => state.meteringBars);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const isPaused = useAudioSessionStore((state) => state.isPaused);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const handlePauseResume = useAudioSessionStore((state) => state.handlePauseResume);
  const resetSession = useAudioSessionStore((state) => state.resetSession);

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
        onPauseResume={handlePauseResume}
        onMainAction={handleMainAction}
        onReset={resetSession}
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
