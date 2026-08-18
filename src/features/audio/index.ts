export { useAudioSessionStore, useRecordingsStore } from './store';
export type { AudioSessionState, AudioSessionContextValue, RecordingsState, SaveRecordingParams, UpdateRecordingParams, SaveProjectParams, UpdateProjectParams } from './store';

export { RecorderSection, RecordingOptimizeOverlay, RecordingsList, RecordingEditor, RecordingEditorScreenState } from './components';
export { StudioEditor } from './components/studio/studio-editor';
export type { RecordingEditorProps } from './types/recording-editor';
export type { StudioEditorProps } from './types/studio';

export { useAudioRecorderBinding } from './hooks/use-audio-recorder-binding';
export { useOpenEditorOnPreview } from './hooks/use-open-editor-on-preview';
export { useRecordingEditorRoute } from './hooks/use-recording-editor-route';
export { useStudioRoute } from './hooks/use-studio-route';
export { useRecordingEditorSession } from './hooks/use-recording-editor-session';
export { useRecordingsHydration } from './hooks/use-recordings-hydration';

export { useRecordingPlayback } from './hooks/use-recording-playback';
export { METERING_BAR_COUNT } from './domain/recorder-session.helpers';
