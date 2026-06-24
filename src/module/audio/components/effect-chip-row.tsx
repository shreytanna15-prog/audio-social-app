import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { effectHasSettingsDrawer } from '@/module/audio/domain/effect-definitions';
import { useTheme } from '@/hooks/use-theme';
import { AUDIO_EFFECTS, type AudioEffectId } from '@/module/audio/types/effects';

type EffectChipRowProps = {
  selectedEffectIds?: AudioEffectId[];
  onEffectPress?: (effectId: AudioEffectId) => void;
  /** @deprecated Use onEffectPress instead. */
  onToggleEffect?: (effectId: AudioEffectId) => void;
  /** @deprecated Use onEffectPress instead. */
  onOpenEffectDrawer?: (effectId: AudioEffectId) => void;
  disabled: boolean;
  isProcessing: boolean;
  processingLabel?: string;
};

export function EffectChipRow({
  selectedEffectIds = [],
  onEffectPress,
  onToggleEffect,
  onOpenEffectDrawer,
  disabled = false,
  isProcessing = false,
  processingLabel,
}: EffectChipRowProps) {
  const theme = useTheme();
  const chipsDisabled = disabled || isProcessing;

  const handlePress = (effectId: AudioEffectId) => {
    if (onEffectPress) {
      onEffectPress(effectId);
      return;
    }

    if (effectHasSettingsDrawer(effectId)) {
      onOpenEffectDrawer?.(effectId);
      return;
    }

    onToggleEffect?.(effectId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Effects</Text>
        {isProcessing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator size="small" color="#1A73E8" />
            {processingLabel ? <Text style={styles.processingText}>{processingLabel}</Text> : null}
          </View>
        ) : null}
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {AUDIO_EFFECTS.map((effect) => {
          const isSelected = selectedEffectIds.includes(effect.id);

          return (
            <Pressable
              key={effect.id}
              disabled={chipsDisabled}
              onPress={() => handlePress(effect.id)}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
                chipsDisabled && styles.chipDisabled,
              ]}>
              <SymbolView
                name={effect.icon}
                size={16}
                tintColor={isSelected ? '#ffffff' : theme.text}
              />
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {effect.label}
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1D21',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  processingText: {
    fontSize: 12,
    color: '#1A73E8',
    flexShrink: 1,
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
