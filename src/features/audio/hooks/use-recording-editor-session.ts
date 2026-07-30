import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { deleteProcessedRecording } from '@/features/audio/data/processed-recording.repository';
import {
  getEffectErrorDebugDetails,
  toEffectErrorPresentation,
  type EffectErrorPresentation,
} from '@/features/audio/domain/audio-effect-errors';
import { useRecordingPlayback } from '@/features/audio/hooks/use-recording-playback';
import { applyEditChain } from '@/features/audio/services/apply-edit-chain.service';
import {
  EMPTY_EDIT_CHAIN,
  getEditChainLabel,
  getEditChainProcessingLabel,
  isEditChainEmpty,
  type AutotuneSelection,
  type CompressorPresetId,
  type EchoPresetId,
  type EditChainSelection,
  type EqPresetId,
  type ReverbPresetId,
} from '@/features/audio/types/edit-chips';
import type { AppliedEffect } from '@/features/audio/types/applied-effects';

type PresetSheetKind = 'autotune' | 'compressor' | 'eq' | 'echo' | 'reverb';

type UseRecordingEditorSessionOptions = {
  pristineUri: string;
  playbackUri: string;
  sourcePreGateUri?: string | null;
  initialAppliedEffects?: AppliedEffect[];
  isSaving: boolean;
  onEffectError?: (error: EffectErrorPresentation) => void;
};

function selectionFromAppliedEffects(
  effects: AppliedEffect[] | undefined,
): EditChainSelection {
  if (!effects || effects.length === 0) {
    return { ...EMPTY_EDIT_CHAIN };
  }

  const next = { ...EMPTY_EDIT_CHAIN };
  for (const effect of effects) {
    if (effect.id === 'denoise') {
      next.cleanVoice = true;
    }
  }
  return next;
}

function appliedEffectsFromSelection(selection: EditChainSelection): AppliedEffect[] {
  const effects: AppliedEffect[] = [];
  if (selection.cleanVoice) {
    effects.push({ id: 'denoise', params: { strength: 'medium' } });
  }
  return effects;
}

export function useRecordingEditorSession({
  pristineUri,
  playbackUri,
  sourcePreGateUri = null,
  initialAppliedEffects = [],
  isSaving = false,
  onEffectError,
}: UseRecordingEditorSessionOptions) {
  const baselineUri = pristineUri;
  const [workingUri, setWorkingUri] = useState(playbackUri);
  const [selection, setSelection] = useState<EditChainSelection>(() =>
    selectionFromAppliedEffects(initialAppliedEffects),
  );
  const [presetSheet, setPresetSheet] = useState<PresetSheetKind | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeBaselineRef = useRef(baselineUri);
  const pendingSelectionRef = useRef<EditChainSelection | null>(null);

  useEffect(() => {
    if (activeBaselineRef.current === baselineUri) {
      return;
    }

    activeBaselineRef.current = baselineUri;
    pendingSelectionRef.current = null;
    setWorkingUri(playbackUri);
    setSelection(selectionFromAppliedEffects(initialAppliedEffects));
    setPresetSheet(null);
    setIsProcessing(false);
    console.warn(`[Editor] reset session for new take uri=${baselineUri}`);
  }, [baselineUri, initialAppliedEffects, playbackUri]);

  const playback = useRecordingPlayback(workingUri);

  const canReset = !isEditChainEmpty(selection) && !isProcessing && !isSaving;
  const effectLabel = getEditChainLabel(selection);
  const isPlaybackDisabled = isProcessing || isSaving;
  const processingLabel = isProcessing
    ? getEditChainProcessingLabel(pendingSelectionRef.current ?? selection)
    : undefined;

  const rebuildChain = useCallback(
    async (nextSelection: EditChainSelection) => {
      pendingSelectionRef.current = nextSelection;
      setIsProcessing(true);
      playback.pause();

      try {
        const previousUri = workingUri;

        if (isEditChainEmpty(nextSelection)) {
          await deleteProcessedRecording(previousUri, baselineUri);
          setWorkingUri(baselineUri);
          setSelection(nextSelection);
          return;
        }

        const nextUri = await applyEditChain({
          baselineUri,
          sourcePreGateUri,
          selection: nextSelection,
        });

        await deleteProcessedRecording(previousUri, baselineUri);
        setWorkingUri(nextUri);
        setSelection(nextSelection);
      } catch (error) {
        const presentation = toEffectErrorPresentation(error, []);
        presentation.title = "Couldn't apply edit";
        console.warn('Edit chain failed:', getEffectErrorDebugDetails(error));
        onEffectError?.(presentation);
      } finally {
        pendingSelectionRef.current = null;
        setIsProcessing(false);
      }
    },
    [baselineUri, onEffectError, playback, sourcePreGateUri, workingUri],
  );

  const toggleCleanVoice = useCallback(() => {
    if (isProcessing || isSaving) {
      return;
    }

    if (selection.cleanVoice) {
      void rebuildChain({
        ...selection,
        cleanVoice: false,
      });
      return;
    }

    Alert.alert(
      'Clean Voice',
      'Clean Voice is made for speech and singing — not instruments. On guitar, piano, or other instruments it can make the sound worse or remove musical detail.\n\nProcessing can take a little while. Please wait until it finishes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            void rebuildChain({
              ...selection,
              cleanVoice: true,
            });
          },
        },
      ],
    );
  }, [isProcessing, isSaving, rebuildChain, selection]);

  const openPresetSheet = useCallback(
    (kind: PresetSheetKind) => {
      if (isProcessing || isSaving) {
        return;
      }
      setPresetSheet(kind);
    },
    [isProcessing, isSaving],
  );

  const closePresetSheet = useCallback(() => {
    if (isProcessing) {
      return;
    }
    setPresetSheet(null);
  }, [isProcessing]);

  const selectAutotune = useCallback(
    (value: AutotuneSelection | null) => {
      if (isProcessing || isSaving) {
        return;
      }

      if (value == null) {
        setPresetSheet(null);
        void rebuildChain({
          ...selection,
          autotune: null,
        });
        return;
      }

      const alreadyOn = selection.autotune != null;
      const apply = () => {
        setPresetSheet(null);
        void rebuildChain({
          ...selection,
          autotune: value,
        });
      };

      if (alreadyOn) {
        apply();
        return;
      }

      Alert.alert(
        'Autotune',
        'Autotune is made for singing and speech — not instruments. On guitar, piano, or other instruments it can make the sound worse or pull notes to the wrong pitch.\n\nProcessing can take a little while. Please wait until it finishes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            onPress: apply,
          },
        ],
      );
    },
    [isProcessing, isSaving, rebuildChain, selection],
  );

  const selectCompressor = useCallback(
    (preset: CompressorPresetId | null) => {
      setPresetSheet(null);
      void rebuildChain({
        ...selection,
        compressor: selection.compressor === preset ? null : preset,
      });
    },
    [rebuildChain, selection],
  );

  const selectEq = useCallback(
    (preset: EqPresetId | null) => {
      setPresetSheet(null);
      void rebuildChain({
        ...selection,
        eq: selection.eq === preset ? null : preset,
      });
    },
    [rebuildChain, selection],
  );

  const selectEcho = useCallback(
    (preset: EchoPresetId | null) => {
      setPresetSheet(null);
      void rebuildChain({
        ...selection,
        echo: selection.echo === preset ? null : preset,
      });
    },
    [rebuildChain, selection],
  );

  const selectReverb = useCallback(
    (preset: ReverbPresetId | null) => {
      setPresetSheet(null);
      void rebuildChain({
        ...selection,
        reverb: selection.reverb === preset ? null : preset,
      });
    },
    [rebuildChain, selection],
  );

  const resetEffects = useCallback(async () => {
    if (!canReset) {
      return;
    }

    playback.pause();
    await deleteProcessedRecording(workingUri, baselineUri);
    setWorkingUri(baselineUri);
    setSelection({ ...EMPTY_EDIT_CHAIN });
    setPresetSheet(null);
  }, [baselineUri, canReset, playback, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, baselineUri);
  }, [baselineUri, workingUri]);

  const togglePlayback = useCallback(() => {
    console.warn("[Play] editor workingUri");
    playback.togglePlayback();
  }, [playback]);

  return {
    workingUri,
    selection,
    appliedEffects: appliedEffectsFromSelection(selection),
    effectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    togglePlayback,
    toggleCleanVoice,
    openPresetSheet,
    closePresetSheet,
    presetSheet,
    selectAutotune,
    selectCompressor,
    selectEq,
    selectEcho,
    selectReverb,
    resetEffects,
    cleanupWorkingFile,
  };
}
