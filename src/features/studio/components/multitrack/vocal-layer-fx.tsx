import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import {
  EditChipRow,
  EditPresetSheet,
  compressorSheetOptions,
  echoSheetOptions,
  eqSheetOptions,
  reverbSheetOptions,
} from '@/features/audio/components/edit-chip-row';
import { FxSheet } from '@/features/audio/components/fx-sheet';
import { useRecordingEditorSession } from '@/features/audio/hooks/use-recording-editor-session';
import { toStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import type { CompressorPresetId } from '@/features/audio/types/edit-chips';
import type { EchoPresetId } from '@/features/audio/types/edit-chips';
import type { EqPresetId } from '@/features/audio/types/edit-chips';
import type { ReverbPresetId } from '@/features/audio/types/edit-chips';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';

type VocalLayerFxProps = {
  layerId: string;
  baselineUri: string;
  stemUri: string;
  sourceUri?: string | null;
  initialEditChain?: StoredEditChain;
  durationSeconds: number;
  isSaving: boolean;
  chipVariant?: 'light' | 'dark';
  onStemChange: (layerId: string, stemUri: string, editChain?: StoredEditChain) => void;
  onProcessingChange?: (processing: boolean) => void;
};

export function VocalLayerFx({
  layerId,
  baselineUri,
  stemUri,
  sourceUri,
  initialEditChain,
  durationSeconds,
  isSaving,
  chipVariant = 'light',
  onStemChange,
  onProcessingChange,
}: VocalLayerFxProps) {
  const session = useRecordingEditorSession({
    pristineUri: baselineUri,
    playbackUri: stemUri,
    sourcePreGateUri: sourceUri ?? null,
    initialEditChain,
    durationSeconds,
    isSaving,
    autoPlayAfterProcessing: false,
    onEffectError: ({ title, message }) => {
      Alert.alert(title, message);
    },
  });

  const skipFirstRef = useRef(true);
  const skipProcessingRef = useRef(true);

  useEffect(() => {
    if (skipFirstRef.current) {
      skipFirstRef.current = false;
      return;
    }

    onStemChange(layerId, session.workingUri, toStoredEditChain(session.selection));
  }, [layerId, onStemChange, session.selection, session.workingUri]);

  useEffect(() => {
    if (skipProcessingRef.current) {
      skipProcessingRef.current = false;
      return;
    }

    onProcessingChange?.(session.isProcessing);
  }, [onProcessingChange, session.isProcessing]);

  return (
    <>
      <EditChipRow
        selection={session.uiSelection}
        disabled={isSaving}
        isProcessing={session.isProcessing}
        processingLabel={session.processingLabel}
        variant={chipVariant}
        onCleanVoicePress={session.toggleCleanVoice}
        onOpenFx={() => session.openPresetSheet('fx')}
        onOpenCompressor={() => session.openPresetSheet('compressor')}
        onOpenEq={() => session.openPresetSheet('eq')}
        onOpenEcho={() => session.openPresetSheet('echo')}
        onOpenReverb={() => session.openPresetSheet('reverb')}
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
    </>
  );
}
