import type { AppliedEffect } from '@/features/audio/types/applied-effects';

export type RecordingEditorSavePayload = {
  sourceUri: string;
  appliedEffects: AppliedEffect[];
  sourcePreGateUri?: string | null;
};
