import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import type { AudioEffectId } from '@/features/audio/types/effects';
import type { RecordingEditorSavePayload } from '@/features/audio/types/recording-editor-save';

export type RecordingEditorSource = {
  /** Soft-gated baseline (pending) — Reset target. */
  pristineUri: string;
  playbackUri: string;
  /** Pre-soft-gate WAV for Clean Voice + save source backup. */
  sourcePreGateUri?: string | null;
  initialAppliedEffects?: AppliedEffect[] | AudioEffectId[];
};

export type RecordingEditorProps = {
  source: RecordingEditorSource;
  title: string;
  durationSeconds: number;
  isPending: boolean;
  isSaving: boolean;
  onSave: (payload: RecordingEditorSavePayload) => Promise<void>;
  onDiscard: () => void;
};
