import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  RECORDING_MODE_OPTIONS,
  type RecordingMode,
} from '@/features/audio/types/recording-mode';

type RecordingModePickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: RecordingMode) => void;
};

export function RecordingModePicker({
  visible,
  onClose,
  onSelect,
}: RecordingModePickerProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>What are you recording?</Text>
            <Text style={styles.subtitle}>
              Choose a mode for enhance, or Raw for an unprocessed capture.
            </Text>
          </View>

          <View style={styles.options}>
            {RECORDING_MODE_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                disabled={!option.available}
                onPress={() => {
                  console.warn(
                    `[Recorder] Mode selected: id="${option.id}" label="${option.label}" available=${option.available}`,
                  );
                  onSelect(option.id);
                }}
                style={({ pressed }) => [
                  styles.option,
                  !option.available && styles.optionDisabled,
                  pressed && option.available && styles.optionPressed,
                ]}>
                <View style={styles.optionText}>
                  <Text
                    style={[
                      styles.optionLabel,
                      !option.available && styles.optionLabelDisabled,
                    ]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.optionDescription,
                      !option.available && styles.optionDescriptionDisabled,
                    ]}>
                    {option.description}
                  </Text>
                </View>
                {!option.available ? (
                  <Text style={styles.comingSoon}>Soon</Text>
                ) : null}
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    ...Platform.select({
      android: {
        elevation: 32,
      },
    }),
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingHorizontal: 16,
    gap: 16,
    ...Platform.select({
      android: {
        elevation: 24,
      },
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#DADCE0',
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D21',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#7A7F87',
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionPressed: {
    backgroundColor: '#E8F0FE',
    borderColor: '#1A73E8',
  },
  optionDisabled: {
    opacity: 0.72,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1D21',
  },
  optionLabelDisabled: {
    color: '#5F6368',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#7A7F87',
  },
  optionDescriptionDisabled: {
    color: '#9AA0A6',
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9AA0A6',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F4',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F6368',
  },
});
