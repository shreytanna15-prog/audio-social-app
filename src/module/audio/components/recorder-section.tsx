import { StyleSheet, View } from 'react-native';

import { RecorderControls } from '@/module/audio/components/recorder-controls';
import { RecorderHeader } from '@/module/audio/components/recorder-header';
import { WaveformDisplay } from '@/module/audio/components/waveform-display';

type RecorderSectionProps = {
  status: 'idle' | 'recording' | 'paused' | 'preview';
  timerSeconds: number;
};

export function RecorderSection({ status, timerSeconds }: RecorderSectionProps) {
  const isRecording = status === 'recording' || status === 'paused';

  return (
    <View style={styles.container}>
      <RecorderHeader title="New recording" status={status} timerSeconds={timerSeconds} />
      <WaveformDisplay active={status === 'recording'} height={140} />
      <RecorderControls isRecording={isRecording} isPaused={status === 'paused'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingVertical: 8,
  },
});
