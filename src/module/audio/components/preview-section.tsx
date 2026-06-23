import { StyleSheet, Text, View } from 'react-native';

import { EffectChipRow } from '@/module/audio/components/effect-chip-row';
import { PreviewActions } from '@/module/audio/components/preview-actions';
import { RecordingTimer } from '@/module/audio/components/recording-timer';
import { WaveformDisplay } from '@/module/audio/components/waveform-display';
import { useAudioSession } from '@/module/audio/context';

export function PreviewSection() {
  const { previewUri, status, timerSeconds } = useAudioSession();

  if (!previewUri) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview</Text>
      <RecordingTimer seconds={timerSeconds} />
      <WaveformDisplay
        height={64}
        bars={[0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5]}
        active={status === 'preview'}
      />
      <PreviewActions />
      <EffectChipRow />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E0E3E7',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
});
