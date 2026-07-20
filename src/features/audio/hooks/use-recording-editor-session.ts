import { useCallback, useRef, useState } from "react";

import { deleteProcessedRecording } from "@/features/audio/data/processed-recording.repository";
import {
  createAppliedEffect,
  effectHasSettingsDrawer,
  getDefaultEffectParams,
  normalizeAppliedEffects,
} from "@/features/audio/domain/effect-definitions";
import {
  getEffectErrorDebugDetails,
  toEffectErrorPresentation,
  type EffectErrorPresentation,
} from "@/features/audio/domain/audio-effect-errors";
import {
  getAppliedEffectsLabel,
  getEffectsProcessingLabel,
} from "@/features/audio/domain/audio-effect.helpers";
import { useRecordingPlayback } from "@/features/audio/hooks/use-recording-playback";
import { applyAudioEffects } from "@/features/audio/services/audio-effects.service";
import type { AppliedEffect, EffectParamValues } from "@/features/audio/types/applied-effects";
import type { RecordingMode } from "@/features/audio/types/recording-mode";
import type { AudioEffectId } from "@/features/audio/types/effects";

type UseRecordingEditorSessionOptions = {
  pristineUri: string;
  playbackUri: string;
  initialAppliedEffects?: AudioEffectId[] | AppliedEffect[];
  recordingMode?: RecordingMode | null;
  isSaving: boolean;
  onEffectError?: (error: EffectErrorPresentation) => void;
};

export function useRecordingEditorSession({
  pristineUri,
  playbackUri,
  initialAppliedEffects = [],
  recordingMode = null,
  isSaving = false,
  onEffectError,
}: UseRecordingEditorSessionOptions) {
  const effectDefaultsContext = { recordingMode };
  const [workingUri, setWorkingUri] = useState(playbackUri);
  const [appliedEffects, setAppliedEffects] = useState<AppliedEffect[]>(() =>
    normalizeAppliedEffects(initialAppliedEffects),
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawerEffectId, setDrawerEffectId] = useState<AudioEffectId | null>(null);
  const pendingAppliedEffectsRef = useRef<AppliedEffect[] | null>(null);

  const playback = useRecordingPlayback(workingUri);

  const canReset = appliedEffects.length > 0 && !isProcessing && !isSaving;
  const effectLabel = getAppliedEffectsLabel(appliedEffects);
  const isPlaybackDisabled = isProcessing || isSaving;
  const processingLabel =
    isProcessing && pendingAppliedEffectsRef.current
      ? getEffectsProcessingLabel(pendingAppliedEffectsRef.current)
      : undefined;

  const activeDrawerEffect = drawerEffectId
    ? appliedEffects.find((effect) => effect.id === drawerEffectId)
    : undefined;

  const processEffects = useCallback(
    async (nextAppliedEffects: AppliedEffect[]) => {
      pendingAppliedEffectsRef.current = nextAppliedEffects;
      setIsProcessing(true);
      playback.pause();

      try {
        const previousUri = workingUri;

        if (nextAppliedEffects.length === 0) {
          await deleteProcessedRecording(previousUri, pristineUri);
          setWorkingUri(pristineUri);
          setAppliedEffects([]);
        } else {
          const nextUri = await applyAudioEffects(nextAppliedEffects, pristineUri);

          await deleteProcessedRecording(previousUri, pristineUri);

          setWorkingUri(nextUri);
          setAppliedEffects(nextAppliedEffects);
        }
      } catch (error) {
        const presentation = toEffectErrorPresentation(error, nextAppliedEffects);
        console.warn("Effect processing failed:", getEffectErrorDebugDetails(error));
        onEffectError?.(presentation);
      } finally {
        pendingAppliedEffectsRef.current = null;
        setIsProcessing(false);
      }
    },
    [onEffectError, playback, pristineUri, workingUri],
  );

  const openEffectDrawer = useCallback(
    (effectId: AudioEffectId) => {
      if (isProcessing || isSaving || !effectHasSettingsDrawer(effectId)) {
        return;
      }

      setDrawerEffectId(effectId);
    },
    [isProcessing, isSaving],
  );

  const pressEffect = useCallback(
    (effectId: AudioEffectId) => {
      if (isProcessing || isSaving) {
        return;
      }

      if (effectHasSettingsDrawer(effectId)) {
        openEffectDrawer(effectId);
        return;
      }

      const isSelected = appliedEffects.some((effect) => effect.id === effectId);
      const nextAppliedEffects = isSelected
        ? appliedEffects.filter((effect) => effect.id !== effectId)
        : [...appliedEffects, createAppliedEffect(effectId, undefined, effectDefaultsContext)];

      void processEffects(nextAppliedEffects);
    },
    [appliedEffects, effectDefaultsContext, isProcessing, isSaving, openEffectDrawer, processEffects],
  );

  const toggleEffect = useCallback(
    async (effectId: AudioEffectId) => {
      pressEffect(effectId);
    },
    [pressEffect],
  );

  const closeEffectDrawer = useCallback(() => {
    if (isProcessing) {
      return;
    }

    setDrawerEffectId(null);
  }, [isProcessing]);

  const applyEffectFromDrawer = useCallback(
    async (effectId: AudioEffectId, params: EffectParamValues) => {
      if (isProcessing || isSaving) {
        return;
      }

      const withoutCurrent = appliedEffects.filter((effect) => effect.id !== effectId);
      const nextAppliedEffects = [...withoutCurrent, { id: effectId, params }];

      setDrawerEffectId(null);
      await processEffects(nextAppliedEffects);
    },
    [appliedEffects, isProcessing, isSaving, processEffects],
  );

  const removeEffectFromDrawer = useCallback(
    async (effectId: AudioEffectId) => {
      if (isProcessing || isSaving) {
        return;
      }

      const nextAppliedEffects = appliedEffects.filter((effect) => effect.id !== effectId);

      setDrawerEffectId(null);
      await processEffects(nextAppliedEffects);
    },
    [appliedEffects, isProcessing, isSaving, processEffects],
  );

  const resetEffects = useCallback(async () => {
    if (!canReset) {
      return;
    }

    playback.pause();
    await deleteProcessedRecording(workingUri, pristineUri);
    setWorkingUri(pristineUri);
    setAppliedEffects([]);
    setDrawerEffectId(null);
  }, [canReset, playback, pristineUri, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, pristineUri);
  }, [pristineUri, workingUri]);

  return {
    workingUri,
    appliedEffects,
    selectedEffectIds: appliedEffects.map((effect) => effect.id),
    effectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    togglePlayback: playback.togglePlayback,
    toggleEffect,
    pressEffect,
    openEffectDrawer,
    closeEffectDrawer,
    drawerEffectId,
    activeDrawerEffect,
    drawerInitialParams:
      drawerEffectId === null
        ? undefined
        : activeDrawerEffect?.params ??
          getDefaultEffectParams(drawerEffectId, effectDefaultsContext),
    isDrawerEffectActive: drawerEffectId
      ? appliedEffects.some((effect) => effect.id === drawerEffectId)
      : false,
    applyEffectFromDrawer,
    removeEffectFromDrawer,
    resetEffects,
    cleanupWorkingFile,
  };
}
