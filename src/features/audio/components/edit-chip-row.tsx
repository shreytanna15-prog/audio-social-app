import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EffectPresetSheet } from '@/features/audio/components/effect-preset-sheet';
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
  /** Quick Record capture: Soft SpectralGate is fixed; hide Clean Voice chip. */
  hideCleanVoice?: boolean;
  /**
   * When false, chips stay tappable while processing (selection queues; apply deferred).
   * @default true
   */
  disableWhileProcessing?: boolean;
  onCleanVoicePress?: () => void;
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
  hideCleanVoice = false,
  disableWhileProcessing = true,
  onCleanVoicePress,
  onOpenFx,
  onOpenCompressor,
  onOpenEq,
  onOpenEcho,
  onOpenReverb,
}: EditChipRowProps) {
  const busy = disabled || (disableWhileProcessing && isProcessing);
  const dark = variant === 'dark';
  const accent = dark ? '#A078FF' : '#1A73E8';
  const iconIdle = dark ? '#CBC3D7' : '#1A1D21';
  const iconActive = dark ? '#E4E1EA' : '#FFFFFF';

  const tools: ToolCard[] = [
    ...(hideCleanVoice || !onCleanVoicePress
      ? []
      : [
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
          } satisfies ToolCard,
        ]),
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
    <EffectPresetSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title={title}
      options={options}
      selectedId={selectedId}
      onSelect={onSelect}
      onClear={selectedId ? onClear : undefined}
      clearLabel={`Turn off ${title.toLowerCase()}`}
    />
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
});
