import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { RecordingEditorSavePayload } from '@/features/audio/types/recording-editor-save';

export type RecordingEditorSource = {
  /** Soft-gated baseline (pending or baseline.wav) — Reset target and rebuild anchor. */
  pristineUri: string;
  playbackUri: string;
  /** Pre-soft-gate WAV for Clean Voice + save source backup. */
  sourcePreGateUri?: string | null;
  initialEditChain?: StoredEditChain;
};

export type RecordingEditorProps = {
  source: RecordingEditorSource;
  title: string;
  durationSeconds: number;
  isPending: boolean;
  isSaving: boolean;
  /** Returns true when the recording was saved successfully. */
  onSave: (payload: RecordingEditorSavePayload) => Promise<boolean>;
  /**
   * Background save that keeps the editor open. Absent for pending takes, which
   * only exist in the index once `onSave` runs.
   */
  onPersist?: (payload: RecordingEditorSavePayload) => Promise<boolean>;
  /** Leaves the editor without touching storage, for when disk is already current. */
  onClose: () => void;
  onDiscard: () => void;
};
