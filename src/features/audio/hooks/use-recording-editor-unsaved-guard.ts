import { useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export type LeavePromptHandlers = {
  keepEditing: () => void;
  leaveWithoutSaving: () => void;
  saveAndLeave: () => void;
};

type UseRecordingEditorUnsavedGuardOptions = {
  enabled: boolean;
  /**
   * Read when the event fires rather than captured per render, so the listener
   * never decides based on a stale snapshot and never needs resubscribing.
   */
  shouldPrompt: () => boolean;
  /** Must persist without navigating — this hook releases the pending action. */
  onSave: () => Promise<boolean>;
  /**
   * Shared FeedbackDialog (or equivalent). When omitted, falls back to native
   * Alert for callers that have not been migrated yet.
   */
  onPromptLeave?: (handlers: LeavePromptHandlers) => void;
  title?: string;
  message?: string;
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
  onPromptLeave,
  title = 'Save effects?',
  message = 'Your effects are not saved yet. Save before leaving?',
}: UseRecordingEditorUnsavedGuardOptions): void {
  const navigation = useNavigation();
  const shouldPromptRef = useRef(shouldPrompt);
  const onSaveRef = useRef(onSave);
  const onPromptLeaveRef = useRef(onPromptLeave);
  const titleRef = useRef(title);
  const messageRef = useRef(message);

  useEffect(() => {
    shouldPromptRef.current = shouldPrompt;
    onSaveRef.current = onSave;
    onPromptLeaveRef.current = onPromptLeave;
    titleRef.current = title;
    messageRef.current = message;
  }, [message, onPromptLeave, onSave, shouldPrompt, title]);

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

      const handlers: LeavePromptHandlers = {
        keepEditing: () => undefined,
        leaveWithoutSaving: release,
        saveAndLeave: () => {
          void (async () => {
            if (await onSaveRef.current()) {
              release();
            }
          })();
        },
      };

      if (onPromptLeaveRef.current) {
        onPromptLeaveRef.current(handlers);
        return;
      }

      Alert.alert(titleRef.current, messageRef.current, [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: handlers.leaveWithoutSaving,
        },
        {
          text: 'Save',
          onPress: handlers.saveAndLeave,
        },
      ]);
    });
  }, [enabled, navigation]);
}
