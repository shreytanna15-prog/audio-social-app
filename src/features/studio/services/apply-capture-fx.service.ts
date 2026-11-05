import { isEditChainEmpty } from '@/features/audio/types/edit-chips';
import type { EditChainSelection } from '@/features/audio/types/edit-chips';
import { applyEditChain } from '@/features/audio/services/apply-edit-chain.service';
import { normalizeCaptureFxSelection } from '@/features/studio/store/quick-record.store';

/**
 * Render Quick Record capture FX from the post-soft-clean baseline.
 * Never mutates baseline/source; returns a new stem URI (or baseline if empty).
 */
export async function applyCaptureFx(input: {
  baselineUri: string;
  selection: EditChainSelection;
}): Promise<string> {
  const selection = normalizeCaptureFxSelection(input.selection);

  if (isEditChainEmpty(selection)) {
    return input.baselineUri;
  }

  return applyEditChain({
    baselineUri: input.baselineUri,
    sourcePreGateUri: null,
    selection,
  });
}
