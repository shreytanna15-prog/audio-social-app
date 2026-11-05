import { useCallback, useState } from 'react';

import {
  EditChipRow,
  EditPresetSheet,
  compressorSheetOptions,
  echoSheetOptions,
  eqSheetOptions,
  reverbSheetOptions,
} from '@/features/audio/components/edit-chip-row';
import { FxSheet } from '@/features/audio/components/fx-sheet';
import {
  createCompressorSelection,
  createEchoSelection,
  createEqSelection,
  createReverbSelection,
  type CompressorPresetId,
  type EchoPresetId,
  type EditChainSelection,
  type EqPresetId,
  type FxSelection,
  type ReverbPresetId,
} from '@/features/audio/types/edit-chips';

type PresetSheetKind = 'fx' | 'compressor' | 'eq' | 'echo' | 'reverb' | null;

type QuickRecordCaptureFxRowProps = {
  selection: EditChainSelection;
  disabled?: boolean;
  isProcessing?: boolean;
  processingLabel?: string;
  onChange: (selection: EditChainSelection) => void;
};

export function QuickRecordCaptureFxRow({
  selection,
  disabled = false,
  isProcessing = false,
  processingLabel,
  onChange,
}: QuickRecordCaptureFxRowProps) {
  const [presetSheet, setPresetSheet] = useState<PresetSheetKind>(null);

  const closeSheet = useCallback(() => setPresetSheet(null), []);

  const selectFx = useCallback(
    (value: FxSelection | null) => {
      onChange({ ...selection, cleanVoice: false, fx: value });
      closeSheet();
    },
    [closeSheet, onChange, selection],
  );

  const selectCompressor = useCallback(
    (preset: CompressorPresetId | null) => {
      const next =
        preset == null || selection.compressor?.preset === preset
          ? null
          : createCompressorSelection(preset);
      onChange({ ...selection, cleanVoice: false, compressor: next });
      closeSheet();
    },
    [closeSheet, onChange, selection],
  );

  const selectEq = useCallback(
    (preset: EqPresetId | null) => {
      const next =
        preset == null || selection.eq?.preset === preset
          ? null
          : createEqSelection(preset);
      onChange({ ...selection, cleanVoice: false, eq: next });
      closeSheet();
    },
    [closeSheet, onChange, selection],
  );

  const selectEcho = useCallback(
    (preset: EchoPresetId | null) => {
      const next =
        preset == null || selection.echo?.preset === preset
          ? null
          : createEchoSelection(preset);
      onChange({ ...selection, cleanVoice: false, echo: next });
      closeSheet();
    },
    [closeSheet, onChange, selection],
  );

  const selectReverb = useCallback(
    (preset: ReverbPresetId | null) => {
      const next =
        preset == null || selection.reverb?.preset === preset
          ? null
          : createReverbSelection(preset);
      onChange({ ...selection, cleanVoice: false, reverb: next });
      closeSheet();
    },
    [closeSheet, onChange, selection],
  );

  return (
    <>
      <EditChipRow
        selection={selection}
        variant="dark"
        hideCleanVoice
        disableWhileProcessing={false}
        disabled={disabled}
        isProcessing={isProcessing}
        processingLabel={processingLabel}
        onOpenFx={() => setPresetSheet('fx')}
        onOpenCompressor={() => setPresetSheet('compressor')}
        onOpenEq={() => setPresetSheet('eq')}
        onOpenEcho={() => setPresetSheet('echo')}
        onOpenReverb={() => setPresetSheet('reverb')}
      />

      <FxSheet
        visible={presetSheet === 'fx'}
        selection={selection.fx}
        onApply={(value) => selectFx(value)}
        onClear={() => selectFx(null)}
        onClose={closeSheet}
      />
      <EditPresetSheet
        visible={presetSheet === 'compressor'}
        title="Compressor"
        options={compressorSheetOptions()}
        selectedId={selection.compressor?.preset ?? null}
        onSelect={(id) => selectCompressor(id as CompressorPresetId)}
        onClear={() => selectCompressor(null)}
        onClose={closeSheet}
      />
      <EditPresetSheet
        visible={presetSheet === 'eq'}
        title="EQ"
        options={eqSheetOptions()}
        selectedId={selection.eq?.preset ?? null}
        onSelect={(id) => selectEq(id as EqPresetId)}
        onClear={() => selectEq(null)}
        onClose={closeSheet}
      />
      <EditPresetSheet
        visible={presetSheet === 'echo'}
        title="Echo"
        options={echoSheetOptions()}
        selectedId={selection.echo?.preset ?? null}
        onSelect={(id) => selectEcho(id as EchoPresetId)}
        onClear={() => selectEcho(null)}
        onClose={closeSheet}
      />
      <EditPresetSheet
        visible={presetSheet === 'reverb'}
        title="Reverb"
        options={reverbSheetOptions()}
        selectedId={selection.reverb?.preset ?? null}
        onSelect={(id) => selectReverb(id as ReverbPresetId)}
        onClear={() => selectReverb(null)}
        onClose={closeSheet}
      />
    </>
  );
}
