import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { IconButton } from '@/features/audio/components/icon-button';
import {
  COMPRESSOR_PRESETS,
  ECHO_PRESETS,
  EQ_PRESETS,
  REVERB_PRESETS,
  getFxPresetLabel,
  type EditChainSelection,
} from '@/features/audio/types/edit-chips';

type EditChipRowProps = {
  selection: EditChainSelection;
  disabled?: boolean;
  isProcessing?: boolean;
  processingLabel?: string;
  variant?: 'light' | 'dark';
  onCleanVoicePress: () => void;
  onOpenFx: () => void;
  onOpenCompressor: () => void;
  onOpenEq: () => void;
  onOpenEcho: () => void;
  onOpenReverb: () => void;
};

type ToolCard = {
  key: string;
  label: string;
  icon: SymbolViewProps['name'];
  active: boolean;
  onPress: () => void;
};

export function EditChipRow({
  selection,
  disabled = false,
  isProcessing = false,
  processingLabel,
  variant = 'light',
  onCleanVoicePress,
  onOpenFx,
  onOpenCompressor,
  onOpenEq,
  onOpenEcho,
  onOpenReverb,
}: EditChipRowProps) {
  const busy = disabled || isProcessing;
  const dark = variant === 'dark';
  const accent = dark ? '#A078FF' : '#1A73E8';
  const iconIdle = dark ? '#CBC3D7' : '#1A1D21';
  const iconActive = dark ? '#E4E1EA' : '#FFFFFF';

  const tools: ToolCard[] = [
    {
      key: 'clean-voice',
      label: selection.cleanVoice ? 'Clean Voice · On' : 'Clean Voice',
      icon: {
        ios: 'waveform.path.ecg',
        android: 'graphic_eq',
        web: 'graphic_eq',
      },
      active: selection.cleanVoice,
      onPress: onCleanVoicePress,
    },
    {
      key: 'fx',
      label: selection.fx
        ? `FX · ${getFxPresetLabel(selection.fx.preset)}`
        : 'FX',
      icon: {
        ios: 'music.note',
        android: 'music_note',
        web: 'music_note',
      },
      active: selection.fx != null,
      onPress: onOpenFx,
    },
    {
      key: 'compressor',
      label: selection.compressor
        ? `Comp · ${COMPRESSOR_PRESETS.find((p) => p.id === selection.compressor?.preset)?.label}`
        : 'Compressor',
      icon: {
        ios: 'slider.horizontal.3',
        android: 'tune',
        web: 'tune',
      },
      active: selection.compressor != null,
      onPress: onOpenCompressor,
    },
    {
      key: 'eq',
      label: selection.eq
        ? `EQ · ${EQ_PRESETS.find((p) => p.id === selection.eq?.preset)?.label}`
        : 'EQ',
      icon: {
        ios: 'wand.and.stars',
        android: 'auto_fix_high',
        web: 'auto_fix_high',
      },
      active: selection.eq != null,
      onPress: onOpenEq,
    },
    {
      key: 'echo',
      label: selection.echo
        ? `Echo · ${ECHO_PRESETS.find((p) => p.id === selection.echo?.preset)?.label}`
        : 'Echo',
      icon: {
        ios: 'repeat',
        android: 'repeat',
        web: 'repeat',
      },
      active: selection.echo != null,
      onPress: onOpenEcho,
    },
    {
      key: 'reverb',
      label: selection.reverb
        ? `Reverb · ${REVERB_PRESETS.find((p) => p.id === selection.reverb?.preset)?.label}`
        : 'Reverb',
      icon: {
        ios: 'dot.radiowaves.left.and.right',
        android: 'surround_sound',
        web: 'surround_sound',
      },
      active: selection.reverb != null,
      onPress: onOpenReverb,
    },
  ];

  return (
    <View style={styles.wrap}>
      {dark ? null : (
        <View style={styles.labelRow}>
          <Text style={styles.sectionLabel}>Effects</Text>
          {isProcessing ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color={accent} />
              {processingLabel ? (
                <Text style={[styles.processingText, { color: accent }]} numberOfLines={1}>
                  {processingLabel}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      {dark && isProcessing ? (
        <View style={[styles.processingRow, styles.darkProcessingRow]}>
          <ActivityIndicator size="small" color={accent} />
          {processingLabel ? (
            <Text style={[styles.processingText, styles.darkProcessingText]} numberOfLines={1}>
              {processingLabel}
            </Text>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {tools.map((tool) => (
          <Pressable
            key={tool.key}
            disabled={busy}
            onPress={tool.onPress}
            style={({ pressed }) => [
              styles.chip,
              dark ? styles.chipDark : null,
              tool.active && (dark ? styles.chipActiveDark : styles.chipActive),
              busy && styles.chipDisabled,
              pressed && !busy && styles.chipPressed,
            ]}>
            <SymbolView
              name={tool.icon}
              size={16}
              tintColor={tool.active ? iconActive : iconIdle}
            />
            <Text
              style={[
                styles.chipLabel,
                dark ? styles.chipLabelDark : null,
                tool.active && (dark ? styles.chipLabelActiveDark : styles.chipLabelActive),
              ]}
              numberOfLines={1}>
              {tool.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

type PresetSheetProps = {
  visible: boolean;
  title: string;
  options: { id: string; label: string }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
  onClose: () => void;
};

export function EditPresetSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClear,
  onClose,
}: PresetSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <IconButton
              icon={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              onPress={onClose}
            />
          </View>
          <Text style={styles.sheetSubtitle}>Choose a light preset — easy to undo with Reset.</Text>
          {options.map((option) => {
            const active = selectedId === option.id;
            return (
              <Pressable
                key={option.id}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && styles.optionPressed,
                ]}
                onPress={() => onSelect(option.id)}>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {option.label}
                </Text>
                {active ? (
                  <SymbolView
                    name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                    size={20}
                    tintColor="#1A73E8"
                  />
                ) : (
                  <View style={styles.optionRadio} />
                )}
              </Pressable>
            );
          })}
          {selectedId ? (
            <Pressable style={styles.clearButton} onPress={onClear}>
              <Text style={styles.clearLabel}>Turn off {title.toLowerCase()}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function compressorSheetOptions() {
  return COMPRESSOR_PRESETS.map((item) => ({ id: item.id, label: item.label }));
}

export function eqSheetOptions() {
  return EQ_PRESETS.map((item) => ({ id: item.id, label: item.label }));
}

export function echoSheetOptions() {
  return ECHO_PRESETS.map((item) => ({ id: item.id, label: item.label }));
}

export function reverbSheetOptions() {
  return REVERB_PRESETS.map((item) => ({ id: item.id, label: item.label }));
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5F6368',
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E8EAED',
  },
  chipDark: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#211F26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: '#1A73E8',
  },
  chipActiveDark: {
    backgroundColor: 'rgba(160, 120, 255, 0.22)',
    borderColor: 'rgba(160, 120, 255, 0.45)',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipPressed: {
    opacity: 0.8,
  },
  chipLabel: {
    fontSize: 13,
    color: '#1A1D21',
    fontWeight: '500',
  },
  chipLabelDark: {
    color: '#E4E1EA',
  },
  chipLabelActive: {
    color: '#FFFFFF',
  },
  chipLabelActiveDark: {
    color: '#E4E1EA',
    fontWeight: '600',
  },
  darkProcessingRow: {
    marginBottom: 8,
  },
  darkProcessingText: {
    color: '#CBC3D7',
  },
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F5F7F9',
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
