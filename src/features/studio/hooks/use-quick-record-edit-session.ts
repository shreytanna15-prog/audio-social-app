import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import { hasRecordableContent } from '@/features/audio/domain/project';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import { useQuickRecordStore } from '@/features/studio/store/quick-record.store';
import {
  getSaveTrackDraftTrackId,
  useSaveTrackDraft,
} from '@/features/tracks';

export function useQuickRecordEditSession() {
  const { back, canGoBack, replace } = useRouter();
  const session = useQuickRecordSession();
  const resetStore = useQuickRecordStore((state) => state.reset);
  const saveDraft = useSaveTrackDraft();
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
    replace('/(tabs)');
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
    if (session.isRecording || session.isBusy || isSaving || saveDraft.isPending) {
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

      const layer =
        latest.layers.find((item) => item.id === latest.selectedLayerId) ??
        latest.layers[0];

      if (!layer?.stemUri) {
        Alert.alert('Nothing to save', 'Record a take first.');
        return false;
      }

      const store = useQuickRecordStore.getState();
      const title = store.title;
      const trackId = store.lastSaveTrackId ?? undefined;

      const recording = await saveDraft.mutateAsync({
        project: latest,
        mixdownUri: layer.stemUri,
        title,
        kind: 'SINGLE',
        trackId,
        updateExisting: Boolean(trackId),
      });

      useQuickRecordStore.getState().setLastSaveTrackId(recording.id);
      resetStore();
      session.leaveToHome();
      return true;
    } catch (error) {
      const failedId = getSaveTrackDraftTrackId(error);
      if (failedId) {
        useQuickRecordStore.getState().setLastSaveTrackId(failedId);
      }
      console.log('Quick Record save failed:', error);
      Alert.alert(
        'Could not save',
        getErrorMessage(
          error,
          'Save failed. Check your connection and try again.',
        ),
      );
      return false;
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [isSaving, resetStore, saveDraft, session]);

  return {
    ...session,
    isSaving: isSaving || saveDraft.isPending,
    fxProcessing,
    setFxProcessing,
    save,
    goBackToCapture,
  };
}
