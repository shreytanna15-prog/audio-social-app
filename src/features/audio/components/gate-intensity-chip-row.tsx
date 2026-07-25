import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/core/theme/use-theme';
import {
  SPECTRAL_GATE_INTENSITIES,
  type SpectralGateIntensityId,
} from '@/features/audio/types/spectral-gate-intensity';

type GateIntensityChipRowProps = {
  selectedIntensityId: SpectralGateIntensityId | null;
  onIntensityPress: (intensityId: SpectralGateIntensityId) => void;
  disabled: boolean;
  isProcessing: boolean;
};

export function GateIntensityChipRow({
  selectedIntensityId,
  onIntensityPress,
  disabled = false,
  isProcessing = false,
}: GateIntensityChipRowProps) {
  const theme = useTheme();
  const chipsDisabled = disabled || isProcessing;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SpectralGate (Gate Lab)</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {SPECTRAL_GATE_INTENSITIES.map((intensity) => {
          const isSelected = selectedIntensityId === intensity.id;

          return (
            <Pressable
              key={intensity.id}
              disabled={chipsDisabled}
              onPress={() => onIntensityPress(intensity.id)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                chipsDisabled && styles.chipDisabled,
              ]}>
              <SymbolView
                name={intensity.icon}
                size={16}
                tintColor={isSelected ? '#ffffff' : theme.text}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {intensity.label}
              </Text>
            </Pressable>
          );
        })}
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
  chipDisabled: {
    opacity: 0.5,
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
