import { isEditChainEmpty } from '@/features/audio/types/edit-chips';
import type { EditChainSelection } from '@/features/audio/types/edit-chips';
import { applyEditChain } from '@/features/audio/services/apply-edit-chain.service';

export async function applyCaptureFx(input: {
  baselineUri: string;
  sourcePreGateUri?: string | null;
  selection: EditChainSelection;
}): Promise<string> {
  if (isEditChainEmpty(input.selection)) {
    return input.baselineUri;
  }

  return applyEditChain({
    baselineUri: input.baselineUri,
    sourcePreGateUri: input.sourcePreGateUri ?? null,
    selection: input.selection,
  });
}
