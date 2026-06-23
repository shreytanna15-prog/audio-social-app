import { useCallback, useState } from 'react';

import { deleteProcessedRecording } from '@/module/audio/data/processed-recording.repository';
import { getEffectLabel, getEffectProcessingLabel } from '@/module/audio/domain/audio-effect.helpers';
import { useRecordingPlayback } from '@/module/audio/hooks/use-recording-playback';
import { applyAudioEffect } from '@/module/audio/services/audio-effects.service';
import type { AudioEffectId } from '@/module/audio/types/effects';

type UseRecordingEditorSessionOptions = {
  originalUri: string;
  isSaving?: boolean;
  onEffectError?: (message: string) => void;
};

export function useRecordingEditorSession({
  originalUri,
  isSaving = false,
  onEffectError,
}: UseRecordingEditorSessionOptions) {
  const [workingUri, setWorkingUri] = useState(originalUri);
  const [selectedEffectId, setSelectedEffectId] = useState<AudioEffectId | null>(null);
  const [appliedEffectId, setAppliedEffectId] = useState<AudioEffectId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | undefined>();

  const playback = useRecordingPlayback(workingUri);

  const canReset = appliedEffectId != null && !isProcessing && !isSaving;
  const appliedEffectLabel = appliedEffectId ? getEffectLabel(appliedEffectId) : null;
  const isPlaybackDisabled = isProcessing || isSaving;

  const applyEffect = useCallback(
    async (effectId: AudioEffectId) => {
      if (isProcessing || isSaving) {
        return;
      }

      setSelectedEffectId(effectId);
      setIsProcessing(true);
      setProcessingLabel(getEffectProcessingLabel(effectId));
      playback.pause();

      try {
        const previousUri = workingUri;
        const nextUri = await applyAudioEffect(effectId, originalUri);

        await deleteProcessedRecording(previousUri, originalUri);

        setWorkingUri(nextUri);
        setAppliedEffectId(effectId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not apply this effect.';
        onEffectError?.(message);
        setSelectedEffectId(appliedEffectId);
      } finally {
        setIsProcessing(false);
        setProcessingLabel(undefined);
      }
    },
    [
      appliedEffectId,
      isProcessing,
      isSaving,
      onEffectError,
      originalUri,
      playback,
      workingUri,
    ],
  );

  const resetEffects = useCallback(async () => {
    if (!canReset) {
      return;
    }

    playback.pause();
    await deleteProcessedRecording(workingUri, originalUri);
    setWorkingUri(originalUri);
    setSelectedEffectId(null);
    setAppliedEffectId(null);
  }, [canReset, originalUri, playback, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, originalUri);
  }, [originalUri, workingUri]);

  return {
    workingUri,
    selectedEffectId,
    appliedEffectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    togglePlayback: playback.togglePlayback,
    applyEffect,
    resetEffects,
    cleanupWorkingFile,
  };
}
