export { useAudioSessionStore, useRecordingsStore } from './store';
export type { AudioSessionState, AudioSessionContextValue, RecordingsState, SaveRecordingParams, UpdateRecordingParams } from './store';

export { RecorderSection, RecordingOptimizeOverlay, RecordingsList, RecordingEditor, RecordingEditorScreenState } from './components';
export type { RecordingEditorProps } from './types/recording-editor';

export { useAudioRecorderBinding } from './hooks/use-audio-recorder-binding';
export { useOpenEditorOnPreview } from './hooks/use-open-editor-on-preview';
export { useRecordingEditorRoute } from './hooks/use-recording-editor-route';
export { useRecordingEditorSession } from './hooks/use-recording-editor-session';
export { useRecordingsHydration } from './hooks/use-recordings-hydration';

export { useRecordingPlayback } from './hooks/use-recording-playback';
export { METERING_BAR_COUNT } from './domain/recorder-session.helpers';
