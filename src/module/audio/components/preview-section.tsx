import { StyleSheet, View } from 'react-native';

import { EffectChipRow } from '@/module/audio/components/effect-chip-row';
import { PreviewActions } from '@/module/audio/components/preview-actions';
import { WaveformDisplay } from '@/module/audio/components/waveform-display';

export function PreviewSection() {
  return (
    <View style={styles.container}>
      <WaveformDisplay height={64} bars={[0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5]} />
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
});
