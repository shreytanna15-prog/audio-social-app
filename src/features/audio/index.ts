export { useAudioSessionStore, useRecordingsStore } from './store';
export type { AudioSessionState, AudioSessionContextValue, RecordingsState, SaveRecordingParams, UpdateRecordingParams, SaveProjectParams, UpdateProjectParams } from './store';

export { RecorderSection, RecordingOptimizeOverlay, RecordingsList, RecordingEditor, RecordingEditorScreenState } from './components';
export type { RecordingEditorProps } from './types/recording-editor';
export type { StudioEditorProps } from './types/studio';

export { useAudioRecorderBinding } from './hooks/use-audio-recorder-binding';
export { useOpenEditorOnPreview } from './hooks/use-open-editor-on-preview';
export { useRecordingEditorRoute } from './hooks/use-recording-editor-route';
export { useRecordingEditorSession } from './hooks/use-recording-editor-session';
export { useRecordingsHydration } from './hooks/use-recordings-hydration';
export { useSoftCleanQueue } from './hooks/use-soft-clean-queue';
export { useTakeCaptureBridge } from './hooks/use-take-capture-bridge';

export { useRecordingPlayback } from './hooks/use-recording-playback';
export { useStudioPlayback } from './hooks/use-studio-playback';
export { attachVocalTake } from './services/attach-vocal-take.service';
export { METERING_BAR_COUNT } from './domain/recorder-session.helpers';
