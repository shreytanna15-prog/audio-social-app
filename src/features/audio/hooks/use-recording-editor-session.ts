import { useCallback, useEffect, useRef, useState } from "react";

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
import { applyOptimizePipeline } from "@/features/audio/services/apply-optimize-pipeline.service";
import { applySpectralGateIntensity } from "@/features/audio/services/apply-spectral-gate-intensity.service";
import { applyAudioEffects } from "@/features/audio/services/audio-effects.service";
import { logRecorderMode } from "@/features/audio/domain/recorder-mode-log";
import type { AppliedEffect, EffectParamValues } from "@/features/audio/types/applied-effects";
import type { RecordingMode } from "@/features/audio/types/recording-mode";
import type { AudioEffectId } from "@/features/audio/types/effects";
import {
  getOptimizePipelineLabel,
  getOptimizePipelineProcessingLabel,
  type OptimizePipelineId,
} from "@/features/audio/types/optimize-pipeline";
import {
  getSpectralGateIntensityLabel,
  getSpectralGateIntensityProcessingLabel,
  type SpectralGateIntensityId,
} from "@/features/audio/types/spectral-gate-intensity";

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
  const [selectedPipelineId, setSelectedPipelineId] =
    useState<OptimizePipelineId | null>(null);
  const [selectedGateIntensityId, setSelectedGateIntensityId] =
    useState<SpectralGateIntensityId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [drawerEffectId, setDrawerEffectId] = useState<AudioEffectId | null>(null);
  const pendingAppliedEffectsRef = useRef<AppliedEffect[] | null>(null);
  const pendingPipelineIdRef = useRef<OptimizePipelineId | null>(null);
  const pendingGateIntensityIdRef = useRef<SpectralGateIntensityId | null>(null);
  const activePristineUriRef = useRef(pristineUri);

  // Expo Router reuses /recording/new — reset session when the take URI changes.
  useEffect(() => {
    if (activePristineUriRef.current === pristineUri) {
      return;
    }

    activePristineUriRef.current = pristineUri;
    pendingAppliedEffectsRef.current = null;
    pendingPipelineIdRef.current = null;
    pendingGateIntensityIdRef.current = null;
    setWorkingUri(playbackUri);
    setAppliedEffects(normalizeAppliedEffects(initialAppliedEffects));
    setSelectedPipelineId(null);
    setSelectedGateIntensityId(null);
    setIsProcessing(false);
    setDrawerEffectId(null);
    console.warn(`[Editor] reset session for new take uri=${pristineUri}`);
  }, [initialAppliedEffects, playbackUri, pristineUri]);

  const playback = useRecordingPlayback(workingUri);

  const canReset =
    (appliedEffects.length > 0 ||
      selectedPipelineId !== null ||
      selectedGateIntensityId !== null) &&
    !isProcessing &&
    !isSaving;
  const effectLabel =
    selectedGateIntensityId !== null
      ? `${getSpectralGateIntensityLabel(selectedGateIntensityId)} SpectralGate`
      : selectedPipelineId !== null
        ? getOptimizePipelineLabel(selectedPipelineId)
        : getAppliedEffectsLabel(appliedEffects);
  const isPlaybackDisabled = isProcessing || isSaving;
  const processingLabel = isProcessing
    ? pendingGateIntensityIdRef.current
      ? getSpectralGateIntensityProcessingLabel(pendingGateIntensityIdRef.current)
      : pendingPipelineIdRef.current
        ? getOptimizePipelineProcessingLabel(pendingPipelineIdRef.current)
        : pendingAppliedEffectsRef.current
          ? getEffectsProcessingLabel(pendingAppliedEffectsRef.current)
          : undefined
    : undefined;

  const activeDrawerEffect = drawerEffectId
    ? appliedEffects.find((effect) => effect.id === drawerEffectId)
    : undefined;

  const processEffects = useCallback(
    async (nextAppliedEffects: AppliedEffect[]) => {
      pendingAppliedEffectsRef.current = nextAppliedEffects;
      pendingPipelineIdRef.current = null;
      pendingGateIntensityIdRef.current = null;
      setSelectedPipelineId(null);
      setSelectedGateIntensityId(null);
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

  const pressPipeline = useCallback(
    async (pipelineId: OptimizePipelineId) => {
      if (isProcessing || isSaving) {
        return;
      }

      playback.pause();
      setDrawerEffectId(null);
      setSelectedGateIntensityId(null);

      if (selectedPipelineId === pipelineId) {
        setIsProcessing(true);
        pendingPipelineIdRef.current = null;
        try {
          const previousUri = workingUri;
          await deleteProcessedRecording(previousUri, pristineUri);
          setWorkingUri(pristineUri);
          setSelectedPipelineId(null);
          setAppliedEffects([]);
        } catch (error) {
          const presentation = toEffectErrorPresentation(error, []);
          console.warn("Pipeline clear failed:", getEffectErrorDebugDetails(error));
          onEffectError?.(presentation);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      pendingPipelineIdRef.current = pipelineId;
      pendingAppliedEffectsRef.current = null;
      pendingGateIntensityIdRef.current = null;
      setIsProcessing(true);

      try {
        const previousUri = workingUri;
        const nextUri = await applyOptimizePipeline(pristineUri, pipelineId);

        await deleteProcessedRecording(previousUri, pristineUri);

        setWorkingUri(nextUri);
        setSelectedPipelineId(pipelineId);
        setAppliedEffects([]);
      } catch (error) {
        const presentation = toEffectErrorPresentation(error, []);
        presentation.title = `Couldn't apply ${getOptimizePipelineLabel(pipelineId)}`;
        console.warn("Pipeline processing failed:", getEffectErrorDebugDetails(error));
        onEffectError?.(presentation);
      } finally {
        pendingPipelineIdRef.current = null;
        setIsProcessing(false);
      }
    },
    [
      isProcessing,
      isSaving,
      onEffectError,
      playback,
      pristineUri,
      selectedPipelineId,
      workingUri,
    ],
  );

  const pressGateIntensity = useCallback(
    async (intensityId: SpectralGateIntensityId) => {
      if (isProcessing || isSaving) {
        console.warn(
          `[GateLab] SKIP intensity='${intensityId}' (busy processing=${isProcessing} saving=${isSaving})`,
        );
        return;
      }

      playback.pause();
      setDrawerEffectId(null);
      setSelectedPipelineId(null);

      if (selectedGateIntensityId === intensityId) {
        setIsProcessing(true);
        pendingGateIntensityIdRef.current = null;
        try {
          const previousUri = workingUri;
          await deleteProcessedRecording(previousUri, pristineUri);
          setWorkingUri(pristineUri);
          setSelectedGateIntensityId(null);
          setAppliedEffects([]);
          console.warn(`[GateLab] OK cleared intensity='${intensityId}' → pristine`);
        } catch (error) {
          const presentation = toEffectErrorPresentation(error, []);
          console.warn(
            `[GateLab] ERROR clear intensity='${intensityId}': ${getEffectErrorDebugDetails(error)}`,
          );
          onEffectError?.(presentation);
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      pendingGateIntensityIdRef.current = intensityId;
      pendingPipelineIdRef.current = null;
      pendingAppliedEffectsRef.current = null;
      setIsProcessing(true);

      try {
        const previousUri = workingUri;
        const nextUri = await applySpectralGateIntensity(pristineUri, intensityId);

        await deleteProcessedRecording(previousUri, pristineUri);

        setWorkingUri(nextUri);
        setSelectedGateIntensityId(intensityId);
        setAppliedEffects([]);
        console.warn(`[GateLab] OK playing intensity='${intensityId}'`);
      } catch (error) {
        const presentation = toEffectErrorPresentation(error, []);
        presentation.title = `Couldn't apply ${getSpectralGateIntensityLabel(intensityId)} SpectralGate`;
        console.warn(
          `[GateLab] ERROR intensity='${intensityId}': ${getEffectErrorDebugDetails(error)}`,
        );
        onEffectError?.(presentation);
      } finally {
        pendingGateIntensityIdRef.current = null;
        setIsProcessing(false);
      }
    },
    [
      isProcessing,
      isSaving,
      onEffectError,
      playback,
      pristineUri,
      selectedGateIntensityId,
      workingUri,
    ],
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
    setSelectedPipelineId(null);
    setSelectedGateIntensityId(null);
    setDrawerEffectId(null);
  }, [canReset, playback, pristineUri, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, pristineUri);
  }, [pristineUri, workingUri]);

  const togglePlayback = useCallback(() => {
    logRecorderMode('Play', recordingMode);
    playback.togglePlayback();
  }, [playback, recordingMode]);

  return {
    workingUri,
    appliedEffects,
    selectedEffectIds: appliedEffects.map((effect) => effect.id),
    selectedPipelineId,
    selectedGateIntensityId,
    effectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    togglePlayback,
    toggleEffect,
    pressEffect,
    pressPipeline,
    pressGateIntensity,
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
