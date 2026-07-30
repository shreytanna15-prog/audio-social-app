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
  AUTOTUNE_SCALES,
  AUTOTUNE_SPEEDS,
  DEFAULT_AUTOTUNE_SELECTION,
  getAutotuneScaleLabel,
  getAutotuneSpeedLabel,
  type AutotuneScaleId,
  type AutotuneSelection,
  type AutotuneSpeedId,
} from '@/features/audio/types/edit-chips';

type AutotuneSheetProps = {
  visible: boolean;
  selection: AutotuneSelection | null;
  onApply: (value: AutotuneSelection) => void;
  onClear: () => void;
  onClose: () => void;
};

export function AutotuneSheet({
  visible,
  selection,
  onApply,
  onClear,
  onClose,
}: AutotuneSheetProps) {
  const [draftScale, setDraftScale] = useState<AutotuneScaleId>(
    selection?.scale ?? DEFAULT_AUTOTUNE_SELECTION.scale,
  );
  const [draftSpeed, setDraftSpeed] = useState<AutotuneSpeedId>(
    selection?.speed ?? DEFAULT_AUTOTUNE_SELECTION.speed,
  );

  useEffect(() => {
    if (!visible) {
      return;
    }
    setDraftScale(selection?.scale ?? DEFAULT_AUTOTUNE_SELECTION.scale);
    setDraftSpeed(selection?.speed ?? DEFAULT_AUTOTUNE_SELECTION.speed);
  }, [selection, visible]);

  const applyDraft = (next: AutotuneSelection) => {
    setDraftScale(next.scale);
    setDraftSpeed(next.speed);
    onApply(next);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Autotune</Text>
            <IconButton
              icon={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              onPress={onClose}
            />
          </View>
          <Text style={styles.sheetSubtitle}>
            For voice and singing only — not instruments. Processing can take a moment.
          </Text>

          <Text style={styles.sectionLabel}>Strength</Text>
          <View style={styles.speedRow}>
            {AUTOTUNE_SPEEDS.map((speed) => {
              const active = draftSpeed === speed.id;
              return (
                <Pressable
                  key={speed.id}
                  style={({ pressed }) => [
                    styles.speedChip,
                    active && styles.speedChipActive,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() =>
                    applyDraft({
                      scale: draftScale,
                      speed: speed.id,
                    })
                  }>
                  <Text style={[styles.speedLabel, active && styles.speedLabelActive]}>
                    {speed.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Key</Text>
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
                    applyDraft({
                      scale: scale.id,
                      speed: draftSpeed,
                    })
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
                Turn off Autotune ({getAutotuneScaleLabel(selection.scale)} ·{' '}
                {getAutotuneSpeedLabel(selection.speed)})
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1D21',
    marginTop: 4,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  speedChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F5F7F9',
  },
  speedChipActive: {
    backgroundColor: '#E8F1FC',
    borderWidth: 1,
    borderColor: '#B6D4F7',
  },
  speedLabel: {
    fontSize: 13,
    color: '#1A1D21',
    fontWeight: '500',
  },
  speedLabelActive: {
    color: '#1A73E8',
    fontWeight: '600',
  },
  scaleList: {
    maxHeight: 320,
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
