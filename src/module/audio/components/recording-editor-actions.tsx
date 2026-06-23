import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { RecordingEditorMode } from '@/module/audio/types/recording-editor-route';

type RecordingEditorActionsProps = {
  mode: RecordingEditorMode;
  canReset: boolean;
  isSaving: boolean;
  onReset: () => void;
  onDiscard: () => void;
  onSave: () => void;
};

export function RecordingEditorActions({
  mode,
  canReset,
  isSaving,
  onReset,
  onDiscard,
  onSave,
}: RecordingEditorActionsProps) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.secondaryButton, (!canReset || isSaving) && styles.buttonDisabled]}
        disabled={!canReset || isSaving}
        onPress={onReset}>
        <Text style={styles.secondaryButtonText}>Reset to original</Text>
      </Pressable>

      {mode === 'pending' ? (
        <View style={styles.primaryActions}>
          <Pressable
            style={[styles.dangerButton, isSaving && styles.buttonDisabled]}
            disabled={isSaving}
            onPress={onDiscard}>
            <Text style={styles.dangerButtonText}>Discard</Text>
          </Pressable>
          <Pressable
            style={[styles.saveButton, isSaving && styles.buttonDisabled]}
            disabled={isSaving}
            onPress={onSave}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.saveButton, styles.doneButton, isSaving && styles.buttonDisabled]}
          disabled={isSaving}
          onPress={onSave}>
          {isSaving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>Done</Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8EAED',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1D21',
  },
  dangerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C62828',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1A73E8',
  },
  doneButton: {
    flex: undefined,
    width: '100%',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
