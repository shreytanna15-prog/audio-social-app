import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';
import type { RecordingEditorSavePayload } from '@/module/audio/types/recording-editor-save';

export type RecordingEditorSource = {
  pristineUri: string;
  playbackUri: string;
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
