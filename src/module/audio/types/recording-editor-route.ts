import type { RecordingMode } from '@/module/audio/types/recording-mode';

export type RecordingEditorRouteParams = {
  id: string;
  uri?: string;
  duration?: string;
  recordingMode?: RecordingMode;
};
