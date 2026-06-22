import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const EFFECTS = [
  { id: 'enhance', label: 'Enhance', icon: { ios: 'wand.and.stars', android: 'auto_fix_high', web: 'auto_fix_high' } },
  { id: 'denoise', label: 'Denoise', icon: { ios: 'waveform.path.ecg', android: 'graphic_eq', web: 'graphic_eq' } },
  { id: 'reverb', label: 'Reverb', icon: { ios: 'dot.radiowaves.left.and.right', android: 'surround_sound', web: 'surround_sound' } },
  { id: 'echo', label: 'Echo', icon: { ios: 'repeat', android: 'repeat', web: 'repeat' } },
  { id: 'modulate', label: 'Modulate', icon: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' } },
] as const;

export function EffectChipRow() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Effects</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {EFFECTS.map((effect, index) => (
          <Pressable
            key={effect.id}
            style={[styles.chip, index === 0 && styles.chipSelected]}>
            <SymbolView name={effect.icon} size={16} tintColor={index === 0 ? '#ffffff' : theme.text} />
            <Text style={[styles.chipText, index === 0 && styles.chipTextSelected]}>{effect.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  scroll: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E8EAED',
  },
  chipSelected: {
    backgroundColor: '#1A73E8',
  },
  chipText: {
    fontSize: 13,
    color: '#1A1D21',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
