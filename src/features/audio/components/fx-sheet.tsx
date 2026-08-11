import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconButton } from '@/features/audio/components/icon-button';
import {
  AUTOTUNE_CHROMATIC_HINT,
  AUTOTUNE_SCALES,
  DEFAULT_FX_SELECTION,
  FX_KEY_HINT,
  FX_PRESETS,
  createFxSelection,
  getAutotuneScaleLabel,
  getFxPresetHint,
  getFxPresetLabel,
  type AutotuneScaleId,
  type FxPresetId,
  type FxSelection,
} from '@/features/audio/types/edit-chips';

type FxSheetProps = {
  visible: boolean;
  selection: FxSelection | null;
  onApply: (value: FxSelection) => void;
  onClear: () => void;
  onClose: () => void;
};

export function FxSheet({ visible, selection, onApply, onClear, onClose }: FxSheetProps) {
  const [draftPreset, setDraftPreset] = useState<FxPresetId>(
    selection?.preset ?? DEFAULT_FX_SELECTION.preset,
  );
  const [draftScale, setDraftScale] = useState<AutotuneScaleId>(
    selection?.scale ?? DEFAULT_FX_SELECTION.scale,
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftPreset(selection?.preset ?? DEFAULT_FX_SELECTION.preset);
    setDraftScale(selection?.scale ?? DEFAULT_FX_SELECTION.scale);
  }, [selection, visible]);

  const applyDraft = (next: FxSelection) => {
    setDraftPreset(next.preset);
    setDraftScale(next.scale);
    onApply(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>FX</Text>
            <IconButton
              icon={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              onPress={onClose}
            />
          </View>
          <Text style={styles.sheetSubtitle}>
            Pitch-style recipes for voice and singing — not instruments. Processing can take a
            moment.
          </Text>

          <Text style={styles.sectionLabel}>Style</Text>
          <View style={styles.presetRow}>
            {FX_PRESETS.map((preset) => {
              const active = draftPreset === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  style={({ pressed }) => [
                    styles.presetChip,
                    active && styles.presetChipActive,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() =>
                    applyDraft(
                      selection?.preset === preset.id
                        ? { ...selection, scale: draftScale }
                        : createFxSelection(preset.id, draftScale),
                    )
                  }>
                  <Text style={[styles.presetLabel, active && styles.presetLabelActive]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.hint}>{getFxPresetHint(draftPreset)}</Text>

          <Text style={styles.sectionLabel}>Key</Text>
          <Text style={styles.hint}>{FX_KEY_HINT}</Text>
          {draftScale === 'chromatic' ? (
            <Text style={styles.hint}>{AUTOTUNE_CHROMATIC_HINT}</Text>
          ) : null}
          <ScrollView
            style={styles.scaleList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {AUTOTUNE_SCALES.map((scale) => {
              const active = draftScale === scale.id;
              return (
                <Pressable
                  key={scale.id}
                  style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() =>
                    applyDraft(
                      selection?.preset === draftPreset
                        ? {
                            preset: draftPreset,
                            scale: scale.id,
                            params: selection.params,
                          }
                        : createFxSelection(draftPreset, scale.id),
                    )
                  }>
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {scale.label}
                  </Text>
                  {active ? (
                    <SymbolView
                      name={{
                        ios: 'checkmark.circle.fill',
                        android: 'check_circle',
                        web: 'check_circle',
                      }}
                      size={20}
                      tintColor="#1A73E8"
                    />
                  ) : (
                    <View style={styles.optionRadio} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selection ? (
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearLabel}>
                Turn off FX ({getFxPresetLabel(selection.preset)} ·{' '}
                {getAutotuneScaleLabel(selection.scale)})
              </Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,29,33,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 8,
    maxHeight: '85%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D5DAE0',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1D21',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#7A7F87',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: '#7A7F87',
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1D21',
    marginTop: 4,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F7F9',
  },
  presetChipActive: {
    backgroundColor: '#E8F1FC',
    borderWidth: 1,
    borderColor: '#B6D4F7',
  },
  presetLabel: {
    fontSize: 13,
    color: '#1A1D21',
    fontWeight: '500',
  },
  presetLabelActive: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  scaleList: {
    maxHeight: 280,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F5F7F9',
    marginBottom: 8,
  },
  optionActive: {
    backgroundColor: '#E8F1FC',
    borderWidth: 1,
    borderColor: '#B6D4F7',
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 15,
    color: '#1A1D21',
    fontWeight: '500',
  },
  optionLabelActive: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C5CAD3',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  clearLabel: {
    fontSize: 14,
    color: '#7A7F87',
    fontWeight: '500',
  },
});
