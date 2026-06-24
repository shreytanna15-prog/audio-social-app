import type { AppliedEffect } from '@/module/audio/types/applied-effects';

export type RecordingEditorSavePayload = {
  sourceUri: string;
  appliedEffects: AppliedEffect[];
};
