import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EditChipRow,
  EditPresetSheet,
  compressorSheetOptions,
  echoSheetOptions,
  eqSheetOptions,
  reverbSheetOptions,
} from '@/features/audio/components/edit-chip-row';
import { FxSheet } from '@/features/audio/components/fx-sheet';
import { IconButton } from '@/features/audio/components/icon-button';
import { PlaybackScrubber } from '@/features/audio/components/playback-scrubber';
import { RecordingEditorActions } from '@/features/audio/components/recording-editor-actions';
import { RecordingTimer } from '@/features/audio/components/recording-timer';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { toStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import { useRecordingEditorSession } from '@/features/audio/hooks/use-recording-editor-session';
import { useRecordingEditorUnsavedGuard } from '@/features/audio/hooks/use-recording-editor-unsaved-guard';
import { downloadRecording } from '@/features/audio/services/recording-share.service';
import type { RecordingEditorProps } from '@/features/audio/types/recording-editor';
import type { CompressorPresetId } from '@/features/audio/types/edit-chips';
import type { EchoPresetId } from '@/features/audio/types/edit-chips';
import type { EqPresetId } from '@/features/audio/types/edit-chips';
import type { ReverbPresetId } from '@/features/audio/types/edit-chips';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';

const PLACEHOLDER_BARS = [0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5];

type PersistJob = {
  fingerprint: string;
  run: () => Promise<boolean>;
};

function buildPersistFingerprint(
  workingUri: string,
  editChain: ReturnType<typeof toStoredEditChain>,
): string {
  return JSON.stringify({ workingUri, editChain: editChain ?? null });
}

export function RecordingEditor({
  source,
  title,
  durationSeconds,
  isPending,
  isSaving = false,
  onSave,
  onPersist,
  onClose,
  onDiscard,
}: RecordingEditorProps) {
  const { showError, confirm, show, dialog } = useFeedbackDialog();
  const session = useRecordingEditorSession({
    pristineUri: source.pristineUri,
    playbackUri: source.playbackUri,
    sourcePreGateUri: source.sourcePreGateUri ?? null,
    initialEditChain: source.initialEditChain,
    durationSeconds,
    isSaving,
    onEffectError: ({ title: errorTitle, message }) => {
      showError(errorTitle, message);
    },
    confirmEffectApply: (effectTitle, message, onConfirm) => {
      confirm(effectTitle, message, {
        cancelLabel: 'Cancel',
        confirmLabel: 'Continue',
        onConfirm,
      });
    },
  });

  const initialFingerprint = useMemo(
    () =>
      buildPersistFingerprint(
        source.playbackUri,
        source.initialEditChain ?? undefined,
      ),
    [source.initialEditChain, source.playbackUri],
  );

  const persistedFingerprintRef = useRef(initialFingerprint);
  const persistRunRef = useRef<Promise<void> | null>(null);
  const pendingJobRef = useRef<PersistJob | null>(null);
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'error'>(
    'idle',
  );

  const currentFingerprint = useMemo(
    () =>
      buildPersistFingerprint(
        session.workingUri,
        toStoredEditChain(session.selection),
      ),
    [session.selection, session.workingUri],
  );

  const isDirty = currentFingerprint !== initialFingerprint;

  // Each job carries its own payload so a save queued behind a running one can
  // never write an older take's audio under a newer chain's fingerprint.
  const enqueuePersist = useCallback((job: PersistJob) => {
    pendingJobRef.current = job;

    if (persistRunRef.current) {
      return;
    }

    persistRunRef.current = (async () => {
      try {
        let next = pendingJobRef.current;

        while (next) {
          pendingJobRef.current = null;
          setPersistStatus('saving');

          const persisted = await next.run();
          if (persisted) {
            persistedFingerprintRef.current = next.fingerprint;
          }
          setPersistStatus(persisted ? 'idle' : 'error');

          next = pendingJobRef.current;
        }
      } finally {
        persistRunRef.current = null;
      }
    })();
  }, []);

  // Saved recordings persist after every applied chip, so effects survive even
  // when the take is left through the header back button instead of Done.
  useEffect(() => {
    if (!onPersist || session.isProcessing || isSaving) {
      return;
    }

    if (currentFingerprint === persistedFingerprintRef.current) {
      return;
    }

    const payload = {
      sourceUri: session.workingUri,
      baselineUri: session.baselineUri,
      editChain: toStoredEditChain(session.selection),
      sourcePreGateUri: source.sourcePreGateUri ?? null,
    };

    enqueuePersist({
      fingerprint: currentFingerprint,
      run: () => onPersist(payload),
    });
  }, [
    currentFingerprint,
    enqueuePersist,
    isSaving,
    onPersist,
    session.baselineUri,
    session.isProcessing,
    session.selection,
    session.workingUri,
    source.sourcePreGateUri,
  ]);

  // Set before every deliberate exit so the unsaved guard lets it through
  // instead of interrupting it with its own prompt.
  const isLeavingRef = useRef(false);

  const handleDiscard = useCallback(async () => {
    await session.cleanupWorkingFile();
    isLeavingRef.current = true;
    onDiscard();
  }, [onDiscard, session]);

  /** Brings disk up to date with the editor. Never navigates. */
  const persistPendingWork = useCallback(async (): Promise<boolean> => {
    if (session.isProcessing) {
      return false;
    }

    await persistRunRef.current;
    setPersistStatus('idle');

    // Auto-save already committed this exact state, so writing again would only
    // rewrite the audio file. A pending take always needs the write: it has no
    // index entry until this runs.
    const needsWrite =
      isPending || currentFingerprint !== persistedFingerprintRef.current;

    if (needsWrite) {
      const saved = await onSave({
        sourceUri: session.workingUri,
        baselineUri: session.baselineUri,
        editChain: toStoredEditChain(session.selection),
        sourcePreGateUri: source.sourcePreGateUri ?? null,
      });

      if (!saved) {
        setPersistStatus('error');
        return false;
      }

      persistedFingerprintRef.current = currentFingerprint;
    }

    // Auto-save copies out of the temp file but leaves it behind for playback,
    // so dropping it belongs to whichever path finishes the session.
    await session.cleanupWorkingFile();
    return true;
  }, [
    currentFingerprint,
    isPending,
    onSave,
    session,
    source.sourcePreGateUri,
  ]);

  const handleDone = useCallback(async () => {
    if (!(await persistPendingWork())) {
      return;
    }

    isLeavingRef.current = true;
    onClose();
  }, [onClose, persistPendingWork]);

  const shouldPromptBeforeLeaving = useCallback(
    () =>
      isDirty && !isLeavingRef.current && !isSaving && !session.isProcessing,
    [isDirty, isSaving, session.isProcessing],
  );

  useRecordingEditorUnsavedGuard({
    enabled: isPending,
    shouldPrompt: shouldPromptBeforeLeaving,
    onSave: persistPendingWork,
    onPromptLeave: ({ keepEditing, leaveWithoutSaving, saveAndLeave }) => {
      show({
        title: 'Save effects?',
        message: 'Your effects are not saved yet. Save before leaving?',
        actions: [
          { label: 'Keep editing', variant: 'ghost', onPress: keepEditing },
          {
            label: 'Discard',
            variant: 'destructive',
            onPress: leaveWithoutSaving,
          },
          { label: 'Save', variant: 'soft', onPress: saveAndLeave },
        ],
      });
    },
  });

  return (
    <>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled>
        <Text style={styles.title}>{title}</Text>
        <RecordingTimer seconds={durationSeconds} />
        <WaveformDisplay height={120} bars={PLACEHOLDER_BARS} active={session.isPlaying} />
        {session.effectLabel ? (
          <Text style={styles.appliedEffect}>Applied: {session.effectLabel}</Text>
        ) : (
          <Text style={styles.hint}>
            Soft cleanup is already on. Tap FX, Comp, EQ, Echo, or Reverb and pick a
            preset — it applies right away. Reset brings back the cleaned take.
          </Text>
        )}
        {persistStatus === 'saving' ? (
          <Text style={styles.savingHint}>Saving effects…</Text>
        ) : null}
        {persistStatus === 'error' ? (
          <Text style={styles.savingError}>
            Couldn&apos;t save these effects automatically. Tap Done to retry.
          </Text>
        ) : null}
        <View style={styles.playRow}>
          <IconButton
            icon={{
              ios: session.isPlaying ? 'pause.fill' : 'play.fill',
              android: session.isPlaying ? 'pause' : 'play_arrow',
              web: session.isPlaying ? 'pause' : 'play_arrow',
            }}
            variant="primary"
            size={28}
            onPress={session.togglePlayback}
            disabled={session.isPlaybackDisabled}
          />
          <IconButton
            icon={{
              ios: 'arrow.down.circle',
              android: 'download',
              web: 'download',
            }}
            size={22}
            onPress={() => {
              void downloadRecording({
                uri: session.workingUri,
                dialogTitle: title,
              });
            }}
            disabled={session.isPlaybackDisabled}
          />
        </View>
        <PlaybackScrubber
          currentTime={session.currentTime}
          duration={session.duration}
          disabled={session.isPlaybackDisabled}
          onSeek={session.seekTo}
          onReplayFromHere={session.playFromAnchor}
        />
        <EditChipRow
          selection={session.uiSelection}
          disabled={isSaving}
          isProcessing={session.isProcessing}
          processingLabel={session.processingLabel}
          onCleanVoicePress={session.toggleCleanVoice}
          onOpenFx={() => session.openPresetSheet('fx')}
          onOpenCompressor={() => session.openPresetSheet('compressor')}
          onOpenEq={() => session.openPresetSheet('eq')}
          onOpenEcho={() => session.openPresetSheet('echo')}
          onOpenReverb={() => session.openPresetSheet('reverb')}
        />
        <RecordingEditorActions
          isPending={isPending}
          canReset={session.canReset}
          isSaving={isSaving}
          isProcessing={session.isProcessing}
          onReset={() => void session.resetEffects()}
          onDiscard={() => void handleDiscard()}
          onSave={() => void handleDone()}
        />
      </ScrollView>

      <FxSheet
        visible={session.presetSheet === 'fx'}
        selection={session.selection.fx}
        onApply={(value) => session.selectFx(value)}
        onClear={() => session.selectFx(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'compressor'}
        title="Compressor"
        options={compressorSheetOptions()}
        selectedId={session.selection.compressor?.preset ?? null}
        onSelect={(id) => session.selectCompressor(id as CompressorPresetId)}
        onClear={() => session.selectCompressor(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'eq'}
        title="EQ"
        options={eqSheetOptions()}
        selectedId={session.selection.eq?.preset ?? null}
        onSelect={(id) => session.selectEq(id as EqPresetId)}
        onClear={() => session.selectEq(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'echo'}
        title="Echo"
        options={echoSheetOptions()}
        selectedId={session.selection.echo?.preset ?? null}
        onSelect={(id) => session.selectEcho(id as EchoPresetId)}
        onClear={() => session.selectEcho(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'reverb'}
        title="Reverb"
        options={reverbSheetOptions()}
        selectedId={session.selection.reverb?.preset ?? null}
        onSelect={(id) => session.selectReverb(id as ReverbPresetId)}
        onClear={() => session.selectReverb(null)}
        onClose={session.closePresetSheet}
      />
      {dialog}
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1D21',
  },
  hint: {
    fontSize: 13,
    color: '#7A7F87',
    textAlign: 'center',
  },
  savingHint: {
    fontSize: 12,
    color: '#7A7F87',
    textAlign: 'center',
  },
  savingError: {
    fontSize: 12,
    color: '#C62828',
    textAlign: 'center',
  },
  appliedEffect: {
    fontSize: 13,
    color: '#1A73E8',
    textAlign: 'center',
    fontWeight: '500',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 4,
  },
});
