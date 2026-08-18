import type { AudioProject } from '@/features/audio/types/project';

export type StudioSavePayload = {
  project: AudioProject;
  mixdownUri?: string | null;
};

export type StudioEditorProps = {
  initialProject: AudioProject;
  title: string;
  isPending: boolean;
  recordingId: string | null;
  isSaving: boolean;
  onSave: (payload: StudioSavePayload) => Promise<boolean>;
  onPersist?: (payload: StudioSavePayload) => Promise<boolean>;
  onClose: () => void;
  onDiscard: () => void;
};
