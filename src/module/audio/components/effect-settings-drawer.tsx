import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EffectParamField } from '@/module/audio/components/effect-param-field';
import {
  getDefaultEffectParams,
  getEffectDefinition,
} from '@/module/audio/domain/effect-definitions';
import type { EffectParamValues } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

type EffectSettingsDrawerProps = {
  visible: boolean;
  effectId: AudioEffectId | null;
  initialParams?: EffectParamValues;
  isProcessing?: boolean;
  isActive?: boolean;
  onClose: () => void;
  onApply: (params: EffectParamValues) => void;
  onRemove?: () => void;
};

export function EffectSettingsDrawer({
  visible,
  effectId,
  initialParams,
  isProcessing = false,
  isActive = false,
  onClose,
  onApply,
  onRemove,
}: EffectSettingsDrawerProps) {
  const insets = useSafeAreaInsets();
  const definition = effectId ? getEffectDefinition(effectId) : null;
  const [draftParams, setDraftParams] = useState<EffectParamValues>({});
  const isOpen = visible && effectId !== null && definition !== null;

  useEffect(() => {
    if (!isOpen || !effectId) {
      return;
    }

    setDraftParams(initialParams ?? getDefaultEffectParams(effectId));
  }, [effectId, initialParams, isOpen]);

  const updateParam = (paramId: string, value: EffectParamValues[string]) => {
    setDraftParams((current) => ({
      ...current,
      [paramId]: value,
    }));
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />
        {definition ? (
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{definition.label}</Text>
                {definition.description ? (
                  <Text style={styles.subtitle}>{definition.description}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {definition.params.map((param) => (
                <EffectParamField
                  key={param.id}
                  definition={param}
                  value={draftParams[param.id] ?? param.defaultValue}
                  disabled={isProcessing}
                  onChange={(value) => updateParam(param.id, value)}
                />
              ))}
            </ScrollView>

            <View style={styles.actions}>
              {isActive && onRemove ? (
                <Pressable
                  disabled={isProcessing}
                  onPress={onRemove}
                  style={[styles.secondaryButton, isProcessing && styles.buttonDisabled]}>
                  <Text style={styles.secondaryButtonText}>Remove</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={isProcessing}
                onPress={() => onApply(draftParams)}
                style={[styles.primaryButton, isProcessing && styles.buttonDisabled]}>
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isActive ? 'Apply changes' : `Apply ${definition.label.toLowerCase()}`}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}
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
    maxHeight: '82%',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flex: 1,
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
  closeButton: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A73E8',
  },
  content: {
    gap: 20,
    paddingBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A73E8',
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#F1F3F4',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5F6368',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
