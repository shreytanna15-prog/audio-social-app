import { useCallback, useEffect, useRef, useState } from 'react';

import { deleteProcessedRecording } from '@/features/audio/data/processed-recording.repository';
import {
  getEffectErrorDebugDetails,
  toEffectErrorPresentation,
  type EffectErrorPresentation,
} from '@/features/audio/domain/audio-effect-errors';
import { fromStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import { useRecordingPlayback } from '@/features/audio/hooks/use-recording-playback';
import { applyEditChain } from '@/features/audio/services/apply-edit-chain.service';
import {
  EMPTY_EDIT_CHAIN,
  createCompressorSelection,
  createEchoSelection,
  createEqSelection,
  createReverbSelection,
  getEditChainLabel,
  getEditChainProcessingLabel,
  isEditChainEmpty,
  type CompressorPresetId,
  type EchoPresetId,
  type EditChainSelection,
  type EqPresetId,
  type FxSelection,
  type ReverbPresetId,
  type StoredEditChain,
} from '@/features/audio/types/edit-chips';

type PresetSheetKind = 'fx' | 'compressor' | 'eq' | 'echo' | 'reverb';

type ConfirmEffectApply = (
  title: string,
  message: string,
  onConfirm: () => void,
) => void;

type UseRecordingEditorSessionOptions = {
  pristineUri: string;
  playbackUri: string;
  sourcePreGateUri?: string | null;
  initialEditChain?: StoredEditChain;
  durationSeconds?: number;
  isSaving: boolean;
  /**
   * Replay the take right after a chip finishes processing. Off in the studio,
   * where the transport plays every layer instead of this one stem.
   */
  autoPlayAfterProcessing?: boolean;
  onEffectError?: (error: EffectErrorPresentation) => void;
  /** Shared FeedbackDialog for Clean Voice / first FX confirm. */
  confirmEffectApply?: ConfirmEffectApply;
};

export function useRecordingEditorSession({
  pristineUri,
  playbackUri,
  sourcePreGateUri = null,
  initialEditChain,
  durationSeconds = 0,
  isSaving = false,
  autoPlayAfterProcessing = true,
  onEffectError,
  confirmEffectApply,
}: UseRecordingEditorSessionOptions) {
  const baselineUri = pristineUri;
  const [workingUri, setWorkingUri] = useState(playbackUri);
  const [selection, setSelection] = useState<EditChainSelection>(() =>
    fromStoredEditChain(initialEditChain),
  );
  const [presetSheet, setPresetSheet] = useState<PresetSheetKind | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const activeBaselineRef = useRef(baselineUri);
  const pendingSelectionRef = useRef<EditChainSelection | null>(null);
  const resumePlaybackRef = useRef(false);

  useEffect(() => {
    if (activeBaselineRef.current === baselineUri) {
      return;
    }

    activeBaselineRef.current = baselineUri;
    pendingSelectionRef.current = null;
    setWorkingUri(playbackUri);
    setSelection(fromStoredEditChain(initialEditChain));
    setPresetSheet(null);
    setIsProcessing(false);
    console.warn(`[Editor] reset session for new take uri=${baselineUri}`);
  }, [baselineUri, initialEditChain, playbackUri]);

  const playback = useRecordingPlayback(workingUri, {
    fallbackDurationSeconds: durationSeconds,
  });
  const playbackRef = useRef(playback);
  playbackRef.current = playback;

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
      resumePlaybackRef.current = playback.isPlaying;
      playback.markResumeAt(playback.currentTime);
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
        // Auto-play runs after processing ends and the player remounts on the new URI.
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

  // After a successful process, auto-play the new working file once processing ends.
  const autoPlayUriRef = useRef<string | null>(null);
  useEffect(() => {
    if (isProcessing) {
      return;
    }
    if (autoPlayUriRef.current === workingUri) {
      return;
    }
    // Skip initial mount / baseline handoff from route — only auto-play after a chain change.
    if (autoPlayUriRef.current == null) {
      autoPlayUriRef.current = workingUri;
      return;
    }
    autoPlayUriRef.current = workingUri;

    const shouldPlay = autoPlayAfterProcessing || resumePlaybackRef.current;
    resumePlaybackRef.current = false;

    // Bounce writes a new file; the player remounts at 0. Seek back to where
    // playback stopped — no live Superpowered graph.
    const timer = setTimeout(() => {
      const player = playbackRef.current;
      if (shouldPlay) {
        player.playFromAnchor();
        return;
      }

      player.seekToAnchor();
    }, 80);
    return () => clearTimeout(timer);
  }, [autoPlayAfterProcessing, isProcessing, workingUri]);

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

    const apply = () => {
      void rebuildChain({
        ...selection,
        cleanVoice: true,
      });
    };

    if (confirmEffectApply) {
      confirmEffectApply(
        'Clean Voice',
        'Clean Voice is made for speech and singing — not instruments. On guitar, piano, or other instruments it can make the sound worse or remove musical detail.\n\nProcessing can take a little while. Please wait until it finishes.',
        apply,
      );
      return;
    }

    apply();
  }, [confirmEffectApply, isProcessing, isSaving, rebuildChain, selection]);

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

  const selectFx = useCallback(
    (value: FxSelection | null) => {
      if (isProcessing || isSaving) {
        return;
      }

      if (value == null) {
        setPresetSheet(null);
        void rebuildChain({ ...selection, fx: null });
        return;
      }

      const apply = () => {
        setPresetSheet(null);
        void rebuildChain({ ...selection, fx: value });
      };

      if (selection.fx != null) {
        apply();
        return;
      }

      if (confirmEffectApply) {
        confirmEffectApply(
          'FX',
          'FX is made for singing and speech — not instruments. On guitar, piano, or other instruments it can make the sound worse.\n\nProcessing can take a little while. Please wait until it finishes.',
          apply,
        );
        return;
      }

      apply();
    },
    [confirmEffectApply, isProcessing, isSaving, rebuildChain, selection],
  );

  const selectCompressor = useCallback(
    (preset: CompressorPresetId | null) => {
      if (isProcessing || isSaving) {
        return;
      }
      setPresetSheet(null);
      if (preset == null || selection.compressor?.preset === preset) {
        void rebuildChain({ ...selection, compressor: null });
        return;
      }
      void rebuildChain({
        ...selection,
        compressor: createCompressorSelection(preset),
      });
    },
    [isProcessing, isSaving, rebuildChain, selection],
  );

  const selectEq = useCallback(
    (preset: EqPresetId | null) => {
      if (isProcessing || isSaving) {
        return;
      }
      setPresetSheet(null);
      if (preset == null || selection.eq?.preset === preset) {
        void rebuildChain({ ...selection, eq: null });
        return;
      }
      void rebuildChain({
        ...selection,
        eq: createEqSelection(preset),
      });
    },
    [isProcessing, isSaving, rebuildChain, selection],
  );

  const selectEcho = useCallback(
    (preset: EchoPresetId | null) => {
      if (isProcessing || isSaving) {
        return;
      }
      setPresetSheet(null);
      if (preset == null || selection.echo?.preset === preset) {
        void rebuildChain({ ...selection, echo: null });
        return;
      }
      void rebuildChain({
        ...selection,
        echo: createEchoSelection(preset),
      });
    },
    [isProcessing, isSaving, rebuildChain, selection],
  );

  const selectReverb = useCallback(
    (preset: ReverbPresetId | null) => {
      if (isProcessing || isSaving) {
        return;
      }
      setPresetSheet(null);
      if (preset == null || selection.reverb?.preset === preset) {
        void rebuildChain({ ...selection, reverb: null });
        return;
      }
      void rebuildChain({
        ...selection,
        reverb: createReverbSelection(preset),
      });
    },
    [isProcessing, isSaving, rebuildChain, selection],
  );

  const resetEffects = useCallback(async () => {
    if (isProcessing || isSaving) {
      return;
    }

    if (isEditChainEmpty(selection)) {
      return;
    }

    playback.pause();
    await deleteProcessedRecording(workingUri, baselineUri);
    setWorkingUri(baselineUri);
    setSelection({ ...EMPTY_EDIT_CHAIN });
    setPresetSheet(null);
  }, [baselineUri, isProcessing, isSaving, playback, selection, workingUri]);

  const cleanupWorkingFile = useCallback(async () => {
    await deleteProcessedRecording(workingUri, baselineUri);
  }, [baselineUri, workingUri]);

  const togglePlayback = useCallback(() => {
    console.warn('[Play] editor workingUri');
    playback.togglePlayback();
  }, [playback]);

  const seekTo = useCallback(
    (seconds: number) => {
      void playback.seekTo(seconds);
    },
    [playback],
  );

  const playFromAnchor = useCallback(() => {
    playback.playFromAnchor();
  }, [playback]);

  return {
    workingUri,
    baselineUri,
    selection,
    uiSelection: selection,
    effectLabel,
    isProcessing,
    processingLabel,
    canReset,
    isPlaybackDisabled,
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
    duration: playback.duration,
    togglePlayback,
    seekTo,
    playFromAnchor,
    toggleCleanVoice,
    openPresetSheet,
    closePresetSheet,
    presetSheet,
    selectFx,
    selectCompressor,
    selectEq,
    selectEcho,
    selectReverb,
    resetEffects,
    cleanupWorkingFile,
  };
}
