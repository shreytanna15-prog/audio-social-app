import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { hasRecordableContent } from '@/features/audio/domain/project';
import { useRecordingsStore } from '@/features/audio/store/recordings.store';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import { useQuickRecordStore } from '@/features/studio/store/quick-record.store';

/**
 * Edit-step session: same capture/playback/punch-in as Quick Record, plus
 * library Save. Capture bridge is only active while this screen is focused.
 */
export function useQuickRecordEditSession() {
  const { back, canGoBack, replace } = useRouter();
  const session = useQuickRecordSession();
  const resetStore = useQuickRecordStore((state) => state.reset);
  const saveProject = useRecordingsStore((state) => state.saveProject);
  const storeSaving = useRecordingsStore((state) => state.isSaving);
  const [isSaving, setIsSaving] = useState(false);
  const [fxProcessing, setFxProcessing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!session.hasTake) {
      replace('/studio/quick-record');
    }
  }, [replace, session.hasTake]);

  const goBackToCapture = useCallback(() => {
    if (session.isRecording || session.isBusy || fxProcessing || isSaving) {
      return;
    }
    if (canGoBack()) {
      back();
      return;
    }
    replace('/studio/quick-record');
  }, [
    back,
    canGoBack,
    fxProcessing,
    isSaving,
    replace,
    session.isBusy,
    session.isRecording,
  ]);

  const save = useCallback(async () => {
    if (session.isRecording || session.isBusy || isSaving || storeSaving) {
      return false;
    }

    setIsSaving(true);
    try {
      await session.awaitSoftCleanQueue();
      const latest = useQuickRecordStore.getState().project;

      if (!hasRecordableContent(latest)) {
        Alert.alert('Nothing to save', 'Record a take first.');
        return false;
      }

      const saved = await saveProject({ project: latest });
      if (!saved) {
        return false;
      }

      resetStore();
      session.leaveToHome();
      return true;
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [isSaving, resetStore, saveProject, session, storeSaving]);

  return {
    ...session,
    isSaving: isSaving || storeSaving,
    fxProcessing,
    setFxProcessing,
    save,
    goBackToCapture,
  };
}
