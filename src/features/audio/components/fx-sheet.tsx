import { EffectPresetSheet } from '@/features/audio/components/effect-preset-sheet';
import {
  FX_PRESETS,
  createFxSelection,
  getFxPresetHint,
  getFxPresetLabel,
  type FxPresetId,
  type FxSelection,
} from '@/features/audio/types/edit-chips';

type FxSheetProps = {
  visible: boolean;
  selection: FxSelection | null;
  onApply: (value: FxSelection) => void;
  onClear: () => void;
  onClose: () => void;
};

export function FxSheet({
  visible,
  selection,
  onApply,
  onClear,
  onClose,
}: FxSheetProps) {
  const options = FX_PRESETS.map((preset) => ({
    id: preset.id,
    label: preset.label,
    description: getFxPresetHint(preset.id),
  }));

  return (
    <EffectPresetSheet
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      title="FX"
      description="Voice and singing effects, not instruments. Processing can take a moment."
      options={options}
      selectedId={selection?.preset ?? null}
      onSelect={(id) => {
        const preset = id as FxPresetId;
        onApply(
          selection?.preset === preset
            ? { ...selection, scale: 'chromatic' }
            : createFxSelection(preset, 'chromatic'),
        );
      }}
      onClear={selection ? onClear : undefined}
      clearLabel={
        selection
          ? `Turn off FX (${getFxPresetLabel(selection.preset)})`
          : undefined
      }
    />
  );
}
