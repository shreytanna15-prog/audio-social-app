import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/core/theme/use-theme';
import {
  OPTIMIZE_PIPELINES,
  type OptimizePipelineId,
} from '@/features/audio/types/optimize-pipeline';

type PipelineChipRowProps = {
  selectedPipelineId: OptimizePipelineId | null;
  onPipelinePress: (pipelineId: OptimizePipelineId) => void;
  disabled: boolean;
  isProcessing: boolean;
};

export function PipelineChipRow({
  selectedPipelineId,
  onPipelinePress,
  disabled = false,
  isProcessing = false,
}: PipelineChipRowProps) {
  const theme = useTheme();
  const chipsDisabled = disabled || isProcessing;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Pipelines (test)</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {OPTIMIZE_PIPELINES.map((pipeline) => {
          const isSelected = selectedPipelineId === pipeline.id;

          return (
            <Pressable
              key={pipeline.id}
              disabled={chipsDisabled}
              onPress={() => onPipelinePress(pipeline.id)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                chipsDisabled && styles.chipDisabled,
              ]}>
              <SymbolView
                name={pipeline.icon}
                size={16}
                tintColor={isSelected ? '#ffffff' : theme.text}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {pipeline.label}
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
    backgroundColor: '#0B8043',
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
