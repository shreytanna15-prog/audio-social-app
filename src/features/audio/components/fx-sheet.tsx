import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconButton } from '@/features/audio/components/icon-button';
import {
  DEFAULT_FX_SELECTION,
  FX_PRESETS,
  createFxSelection,
  getFxPresetHint,
  getFxPresetLabel,
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

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftPreset(selection?.preset ?? DEFAULT_FX_SELECTION.preset);
  }, [selection, visible]);

  const applyDraft = (next: FxSelection) => {
    setDraftPreset(next.preset);
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
            Voice and singing effects — not instruments. Processing can take a moment.
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
                        ? { ...selection, scale: 'chromatic' }
                        : createFxSelection(preset.id, 'chromatic'),
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

          {selection ? (
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearLabel}>
                Turn off FX ({getFxPresetLabel(selection.preset)})
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
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  optionPressed: {
    opacity: 0.85,
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
