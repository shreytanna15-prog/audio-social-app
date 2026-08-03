import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  EditChipRow,
  EditPresetSheet,
  compressorSheetOptions,
  echoSheetOptions,
  eqSheetOptions,
  reverbSheetOptions,
} from '@/features/audio/components/edit-chip-row';
import { AutotuneSheet } from '@/features/audio/components/autotune-sheet';
import { FxSheet } from '@/features/audio/components/fx-sheet';
import { IconButton } from '@/features/audio/components/icon-button';
import { RecordingEditorActions } from '@/features/audio/components/recording-editor-actions';
import { RecordingTimer } from '@/features/audio/components/recording-timer';
import { WaveformDisplay } from '@/features/audio/components/waveform-display';
import { useRecordingEditorSession } from '@/features/audio/hooks/use-recording-editor-session';
import { toStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import { downloadRecording } from '@/features/audio/services/recording-share.service';
import type { RecordingEditorProps } from '@/features/audio/types/recording-editor';
import type { CompressorPresetId } from '@/features/audio/types/edit-chips';
import type { EchoPresetId } from '@/features/audio/types/edit-chips';
import type { EqPresetId } from '@/features/audio/types/edit-chips';
import type { ReverbPresetId } from '@/features/audio/types/edit-chips';

const PLACEHOLDER_BARS = [0.25, 0.4, 0.65, 0.5, 0.8, 0.55, 0.7, 0.45, 0.6, 0.35, 0.75, 0.5];

export function RecordingEditor({
  source,
  title,
  durationSeconds,
  isPending,
  isSaving = false,
  onSave,
  onDiscard,
}: RecordingEditorProps) {
  const session = useRecordingEditorSession({
    pristineUri: source.pristineUri,
    playbackUri: source.playbackUri,
    sourcePreGateUri: source.sourcePreGateUri ?? null,
    initialEditChain: source.initialEditChain,
    isSaving,
    onEffectError: ({ title: errorTitle, message }) => {
      Alert.alert(errorTitle, message);
    },
  });

  const handleDiscard = async () => {
    await session.cleanupWorkingFile();
    onDiscard();
  };

  const handleSave = async () => {
    const saved = await onSave({
      sourceUri: session.workingUri,
      baselineUri: session.baselineUri,
      editChain: toStoredEditChain(session.selection),
      sourcePreGateUri: source.sourcePreGateUri ?? null,
    });

    // Only delete the temp working file after a successful save. On failure the
    // user stays on this screen and still needs the file for play / retry.
    if (saved) {
      await session.cleanupWorkingFile();
    }
  };

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
            Soft cleanup is already on. Use Autotune for strength, FX for Hard/Natural Snap + Key,
            plus Comp, EQ, Echo, or Reverb. Reset brings back the cleaned take.
          </Text>
        )}
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
        <EditChipRow
          selection={session.selection}
          disabled={isSaving}
          isProcessing={session.isProcessing}
          processingLabel={session.processingLabel}
          onCleanVoicePress={session.toggleCleanVoice}
          onOpenAutotune={() => session.openPresetSheet('autotune')}
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
          onReset={() => void session.resetEffects()}
          onDiscard={() => void handleDiscard()}
          onSave={() => void handleSave()}
        />
      </ScrollView>

      <AutotuneSheet
        visible={session.presetSheet === 'autotune'}
        selection={session.selection.autotune}
        onApply={(value) => session.selectAutotune(value)}
        onClear={() => session.selectAutotune(null)}
        onClose={session.closePresetSheet}
      />
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
        selectedId={session.selection.compressor}
        onSelect={(id) => session.selectCompressor(id as CompressorPresetId)}
        onClear={() => session.selectCompressor(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'eq'}
        title="EQ"
        options={eqSheetOptions()}
        selectedId={session.selection.eq}
        onSelect={(id) => session.selectEq(id as EqPresetId)}
        onClear={() => session.selectEq(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'echo'}
        title="Echo"
        options={echoSheetOptions()}
        selectedId={session.selection.echo}
        onSelect={(id) => session.selectEcho(id as EchoPresetId)}
        onClear={() => session.selectEcho(null)}
        onClose={session.closePresetSheet}
      />
      <EditPresetSheet
        visible={session.presetSheet === 'reverb'}
        title="Reverb"
        options={reverbSheetOptions()}
        selectedId={session.selection.reverb}
        onSelect={(id) => session.selectReverb(id as ReverbPresetId)}
        onClear={() => session.selectReverb(null)}
        onClose={session.closePresetSheet}
      />
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
