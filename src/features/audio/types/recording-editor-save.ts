import type { StoredEditChain } from '@/features/audio/types/edit-chips';

export type RecordingEditorSavePayload = {
  sourceUri: string;
  baselineUri: string;
  editChain?: StoredEditChain;
  sourcePreGateUri?: string | null;
};
