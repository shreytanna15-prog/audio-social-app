import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import type { AudioEffectId } from '@/features/audio/types/effects';
import type { RecordingMode } from '@/features/audio/types/recording-mode';
import type { RecordingEditorSavePayload } from '@/features/audio/types/recording-editor-save';

export type RecordingEditorSource = {
  pristineUri: string;
  playbackUri: string;
  initialAppliedEffects?: AppliedEffect[] | AudioEffectId[];
  recordingMode?: RecordingMode | null;
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
