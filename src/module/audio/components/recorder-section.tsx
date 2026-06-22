import { StyleSheet, View } from 'react-native';

import { RecorderControls, RecorderHeader, WaveformDisplay } from '@/module/audio/components';
import { useAudioSession } from '@/module/audio/context';

export function RecorderSection() {
  const {
    status,
    timerSeconds,
    meteringBars,
    hasActiveSession,
    isPaused,
    handleMainAction,
    handlePauseResume,
    resetSession,
  } = useAudioSession();

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
        canReset={hasActiveSession || status === 'preview'}
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
