import type { AudioEffectId } from '@/module/audio/types/effects';

export type RecordingEditorSavePayload = {
  sourceUri: string;
  appliedEffects: AudioEffectId[];
};
