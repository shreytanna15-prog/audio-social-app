import type { RecordingMode } from '@/features/audio/types/recording-mode';

export type RecordingEditorRouteParams = {
  id: string;
  uri?: string;
  duration?: string;
  recordingMode?: RecordingMode;
};
