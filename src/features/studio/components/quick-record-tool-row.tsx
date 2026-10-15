import { VocalLayerFx } from '@/features/studio/components/multitrack/vocal-layer-fx';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';

type QuickRecordToolRowProps = {
  layerId: string | null;
  baselineUri: string | null;
  stemUri: string | null;
  sourceUri: string | null;
  initialEditChain?: StoredEditChain;
  durationSeconds: number;
  isSaving: boolean;
  disabled?: boolean;
  onStemChange: (layerId: string, stemUri: string, editChain?: StoredEditChain) => void;
  onProcessingChange?: (processing: boolean) => void;
};

/** Shared vocal FX chips — hidden until a take exists. */
export function QuickRecordToolRow({
  layerId,
  baselineUri,
  stemUri,
  sourceUri,
  initialEditChain,
  durationSeconds,
  isSaving,
  disabled = false,
  onStemChange,
  onProcessingChange,
}: QuickRecordToolRowProps) {
  if (!layerId || !baselineUri || !stemUri || disabled) {
    return null;
  }

  return (
    <VocalLayerFx
      layerId={layerId}
      baselineUri={baselineUri}
      stemUri={stemUri}
      sourceUri={sourceUri}
      initialEditChain={initialEditChain}
      durationSeconds={durationSeconds}
      isSaving={isSaving}
      chipVariant="dark"
      onStemChange={onStemChange}
      onProcessingChange={onProcessingChange}
    />
  );
}
