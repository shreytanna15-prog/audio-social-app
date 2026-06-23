import { useCallback, useState } from 'react';

import { deleteProcessedRecording } from '@/module/audio/data/processed-recording.repository';
import {
  getAppliedEffectsLabel,
  getEffectsProcessingLabel,
} from '@/module/audio/domain/audio-effect.helpers';
import { useRecordingPlayback } from '@/module/audio/hooks/use-recording-playback';
import { applyAudioEffects } from '@/module/audio/services/audio-effects.service';
import type { AudioEffectId } from '@/module/audio/types/effects';

type UseRecordingEditorSessionOptions = {
  pristineUri: string;
  playbackUri: string;
  initialAppliedEffects?: AudioEffectId[];
  isSaving?: boolean;
  onEffectError?: (message: string) => void;
};

export function useRecordingEditorSession({
  pristineUri,
  playbackUri,
  initialAppliedEffects = [],
  isSaving = false,
  onEffectError,
}: UseRecordingEditorSessionOptions) {
  const [workingUri, setWorkingUri] = useState(playbackUri);
  const [selectedEffectIds, setSelectedEffectIds] = useState<AudioEffectId[]>(initialAppliedEffects);
  const [appliedEffectIds, setAppliedEffectIds] = useState<AudioEffectId[]>(initialAppliedEffects);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState<string | undefined>();

  const playback = useRecordingPlayback(workingUri);

  const canReset = appliedEffectIds.length > 0 && !isProcessing && !isSaving;
  const appliedEffectLabel = getAppliedEffectsLabel(appliedEffectIds);
  const isPlaybackDisabled = isProcessing || isSaving;

  const toggleEffect = useCallback(
    async (effectId: AudioEffectId) => {
      if (isProcessing || isSaving) {
        return;
      }

      const isSelected = selectedEffectIds.includes(effectId);
      const nextEffectIds = isSelected
        ? selectedEffectIds.filter((id) => id !== effectId)
        : [...selectedEffectIds, effectId];

      setSelectedEffectIds(nextEffectIds);
      setIsProcessing(true);
      setProcessingLabel(getEffectsProcessingLabel(nextEffectIds));
      playback.pause();

      try {
        const previousUri = workingUri;

        if (nextEffectIds.length === 0) {
          await deleteProcessedRecording(previousUri, pristineUri);
          setWorkingUri(pristineUri);
          setAppliedEffectIds([]);
        } else {
          const nextUri = await applyAudioEffects(nextEffectIds, pristineUri);

          await deleteProcessedRecording(previousUri, pristineUri);

          setWorkingUri(nextUri);
          setAppliedEffectIds(nextEffectIds);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not apply effects.';
        onEffectError?.(message);
        setSelectedEffectIds(appliedEffectIds);
      } finally {
        setIsProcessing(false);
        setProcessingLabel(undefined);
      }
    },
    [
      appliedEffectIds,
      isProcessing,
      isSaving,
      onEffectError,
      playback,
      pristineUri,
      selectedEffectIds,
      workingUri,
    ],
  );

  const resetEffects = useCallback(async () => {
    if (!canReset) {
      return;
    }

    playback.pause();
    await deleteProcessedRecording(workingUri, pristineUri);
    setWorkingUri(pristineUri);
    setSelectedEffectIds([]);
    setAppliedEffectIds([]);
  }, [canReset, playback, pristineUri, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, pristineUri);
  }, [pristineUri, workingUri]);

  return {
    workingUri,
    selectedEffectIds,
    appliedEffectIds,
    appliedEffectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    togglePlayback: playback.togglePlayback,
    toggleEffect,
    resetEffects,
    cleanupWorkingFile,
  };
}
