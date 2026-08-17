import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

type UseRecordingEditorUnsavedGuardOptions = {
  enabled: boolean;
  /**
   * Read when the event fires rather than captured per render, so the listener
   * never decides based on a stale snapshot and never needs resubscribing.
   */
  shouldPrompt: () => boolean;
  /** Must persist without navigating — this hook releases the pending action. */
  onSave: () => Promise<boolean>;
};

/**
 * Intercepts leaving a take that has unsaved work. Only this hook may release
 * the action it intercepted; a save that navigated on its own would pop once
 * here and once there, and the second pop has no screen left to remove.
 */
export function useRecordingEditorUnsavedGuard({
  enabled,
  shouldPrompt,
  onSave,
}: UseRecordingEditorUnsavedGuardOptions): void {
  const navigation = useNavigation();
  const shouldPromptRef = useRef(shouldPrompt);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    shouldPromptRef.current = shouldPrompt;
    onSaveRef.current = onSave;
  }, [onSave, shouldPrompt]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Re-dispatching runs these listeners again, so without this the prompt
    // would reappear every time the user confirmed it.
    let hasConfirmed = false;

    return navigation.addListener('beforeRemove', (event) => {
      if (hasConfirmed || !shouldPromptRef.current()) {
        return;
      }

      event.preventDefault();

      const release = () => {
        hasConfirmed = true;
        navigation.dispatch(event.data.action);
      };

      Alert.alert(
        'Save effects?',
        'Your effects are not saved yet. Save before leaving?',
        [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Leave without saving',
            style: 'destructive',
            onPress: release,
          },
          {
            text: 'Save',
            onPress: () => {
              void (async () => {
                if (await onSaveRef.current()) {
                  release();
                }
              })();
            },
          },
        ],
      );
    });
  }, [enabled, navigation]);
}
